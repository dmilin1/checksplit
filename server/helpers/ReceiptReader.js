const Jimp = require("jimp");
const OpenAI = require('openai');
const { createWorker } = require('tesseract.js');

const openai = new OpenAI();

const systemPrompt = `You are a helpful assistant designed to turn receipts scanned using OCR into a JSON output. You respond in JSON format only, with no extra response text.`;

const prompt = `
Your task is to convert text scanned from receipts into a JSON output. The input text may contain extraneous information. The goal is to extract the items and convert them into a JSON output according to the provided TypeScript types below:

type Item = {
    name: string,
    totalPrice: number,
    quantity: number,
}

type OutputFormat = {
    items: Item[]
    tax: number
}

Each line should be listed separately, and if two lines contain the same item, it should be listed as separate items with a quantity of 1. Never combine items. Exclude the subtotal, sales tax, service charge, and total from the list.

Here's an example output:

{
    "items": [{
        "name": "Coke",
        "totalPrice": 1.99,
        "quantity": 1
    }, {
        "name": "hot dog",
        "totalPrice": 5.48,
        "quantity": 2
    }, {
        "name": "chips",
        "totalPrice": 3.99,
        "quantity": 1
    }, {
        "name": "chips",
        "totalPrice": 2.99,
        "quantity": 1
    }],
    "tax": 1.87
}

The input text is:
`;

const promptEnd = `
Ensure that the JSON output follows this structure, listing each item separately, even if they have the same name. If the quantity is greater than 1, it should only be increased when the items are grouped together on the receipt.
`

module.exports = class ReceiptReader {

    async imageFileToJSON(file) {
        const img = await this.readFile(file);
        const imgBase64 = await img.getBase64Async(Jimp.MIME_PNG);
        // return imgBase64;
        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(imgBase64);
        // return text;
        await worker.terminate();
        const json = await this.textToJSON(text);
        return json;
    }

    async textToJSON(text) {
        const response = await openai.chat.completions.create({
            model: "gpt-4-1106-preview",
            response_format: { type: "json_object" },
            messages: [
              {"role": "system", "content": systemPrompt },
              {"role": "user", "content": prompt + text + promptEnd }
            ]
        })
        return JSON.parse(response.choices[0].message.content);
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            Jimp.read(file, async (err, img) => {
                if (err) throw err;
                await this.processImg(img);
                resolve(img);
            });
        });
    }

    async processImg(img) {
        const [pixels, height, width] = [img.bitmap.data, img.bitmap.height, img.bitmap.width];
        // this.blurARGB(pixels, height, width, 1.5);
        this.dilate(pixels, width);
        
        // this.invertColors(pixels);
        await this.binarize(img, pixels);
        // await this.binarize(img, pixels);
    }

    averageBrightness(pixels) {
        let sum = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            sum += gray;
        }
        return sum / (pixels.length / 4) / 255;
    }

    async binarize(img, pixels) {
        // make gaussian a copy of the pixels Buffer
        const copy = img.clone();
        copy.blur(20);
        const blurredImg = copy.bitmap.data;
        // const blurredImg = new Uint8ClampedArray(pixels);
        // this.blurARGB(blurredImg, img.bitmap.height, img.bitmap.width, 6);
        // const thresh = Math.floor(level * 255);
        const calcBrightness = (r, g, b) => {
            return 0.299 * r + 0.587 * g + 0.114 * b;
        }
        for (let i = 0; i < pixels.length; i += 4) {
            const gray = calcBrightness(pixels[i], pixels[i + 1], pixels[i + 2]);
            const blurredImgGray = calcBrightness(blurredImg[i], blurredImg[i + 1], blurredImg[i + 2]);
            let val;
            if (gray >= blurredImgGray * 0.94) {
                val = 255;
            } else {
                val = 0;
            }
            pixels[i] = pixels[i + 1] = pixels[i + 2] = val;
        }
    }

    getARGB(data, i) {
        const offset = i * 4;
        return (
            ((data[offset + 3] << 24) & 0xff000000) |
            ((data[offset] << 16) & 0x00ff0000) |
            ((data[offset + 1] << 8) & 0x0000ff00) |
            (data[offset + 2] & 0x000000ff)
        );
    };

    setPixels(pixels, data) {
        let offset = 0;
        for (let i = 0, al = pixels.length; i < al; i++) {
            offset = i * 4;
            pixels[offset + 0] = (data[i] & 0x00ff0000) >>> 16;
            pixels[offset + 1] = (data[i] & 0x0000ff00) >>> 8;
            pixels[offset + 2] = data[i] & 0x000000ff;
            pixels[offset + 3] = (data[i] & 0xff000000) >>> 24;
        }
    };


    blurARGB(pixels, height, width, rad) {
        // internal kernel stuff for the gaussian blur filter
        let blurRadius;
        let blurKernelSize;
        let blurKernel;
        let blurMult;

        // from https://github.com/processing/p5.js/blob/main/src/image/filters.js
        
        const numPackedPixels = width * height;
        const argb = new Int32Array(numPackedPixels);
        for (let j = 0; j < numPackedPixels; j++) {
          argb[j] = this.getARGB(pixels, j);
        }
        let sum, cr, cg, cb, ca;
        let read, ri, ym, ymi, bk0;
        const a2 = new Int32Array(numPackedPixels);
        const r2 = new Int32Array(numPackedPixels);
        const g2 = new Int32Array(numPackedPixels);
        const b2 = new Int32Array(numPackedPixels);
        let yi = 0;
        let radius = (rad * 3.5) | 0;
        radius = radius < 1 ? 1 : radius < 248 ? radius : 248;
        if (blurRadius !== radius) {
            blurRadius = radius;
            blurKernelSize = (1 + blurRadius) << 1;
            blurKernel = new Int32Array(blurKernelSize);
            blurMult = new Array(blurKernelSize);
            for (let l = 0; l < blurKernelSize; l++) {
                blurMult[l] = new Int32Array(256);
            }

            let bk, bki;
            let bm, bmi;

            for (let i = 1, radiusi = radius - 1; i < radius; i++) {
                blurKernel[radius + i] = blurKernel[radiusi] = bki = radiusi * radiusi;
                bm = blurMult[radius + i];
                bmi = blurMult[radiusi--];
                for (let j = 0; j < 256; j++) {
                    bm[j] = bmi[j] = bki * j;
                }
            }
            bk = blurKernel[radius] = radius * radius;
            bm = blurMult[radius];

            for (let k = 0; k < 256; k++) {
                bm[k] = bk * k;
            }
        }
        let x, y, i;
        let bm;
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                cb = cg = cr = ca = sum = 0;
                read = x - blurRadius;
                if (read < 0) {
                    bk0 = -read;
                    read = 0;
                } else {
                    if (read >= width) {
                        break;
                    }
                    bk0 = 0;
                }
                for (i = bk0; i < blurKernelSize; i++) {
                    if (read >= width) {
                        break;
                    }
                    const c = argb[read + yi];
                    bm = blurMult[i];
                    ca += bm[(c & -16777216) >>> 24];
                    cr += bm[(c & 16711680) >> 16];
                    cg += bm[(c & 65280) >> 8];
                    cb += bm[c & 255];
                    sum += blurKernel[i];
                    read++;
                }
                ri = yi + x;
                a2[ri] = ca / sum;
                r2[ri] = cr / sum;
                g2[ri] = cg / sum;
                b2[ri] = cb / sum;
            }
            yi += width;
        }
        yi = 0;
        ym = -blurRadius;
        ymi = ym * width;
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                cb = cg = cr = ca = sum = 0;
                if (ym < 0) {
                    bk0 = ri = -ym;
                    read = x;
                } else {
                    if (ym >= height) {
                        break;
                    }
                    bk0 = 0;
                    ri = ym;
                    read = x + ymi;
                }
                for (i = bk0; i < blurKernelSize; i++) {
                    if (ri >= height) {
                        break;
                    }
                    bm = blurMult[i];
                    ca += bm[a2[read]];
                    cr += bm[r2[read]];
                    cg += bm[g2[read]];
                    cb += bm[b2[read]];
                    sum += blurKernel[i];
                    ri++;
                    read += width;
                }
                argb[x + yi] =
                    ((ca / sum) << 24) |
                    ((cr / sum) << 16) |
                    ((cg / sum) << 8) |
                    (cb / sum);
            }
            yi += width;
            ymi += width;
            ym++;
        }
        this.setPixels(pixels, argb);
    }

    invertColors(pixels) {
        for (var i = 0; i < pixels.length; i+= 4) {
            pixels[i] = pixels[i] ^ 255; // Invert Red
            pixels[i+1] = pixels[i+1] ^ 255; // Invert Green
            pixels[i+2] = pixels[i+2] ^ 255; // Invert Blue
        }
    }

    // from https://github.com/processing/p5.js/blob/main/src/image/filters.js
    dilate(pixels, width) {
        let currIdx = 0;
        const maxIdx = pixels.length ? pixels.length / 4 : 0;
        const out = new Int32Array(maxIdx);
        let currRowIdx, maxRowIdx, colOrig, colOut, currLum;
        
        let idxRight, idxLeft, idxUp, idxDown;
        let colRight, colLeft, colUp, colDown;
        let lumRight, lumLeft, lumUp, lumDown;
        
        while (currIdx < maxIdx) {
            currRowIdx = currIdx;
            maxRowIdx = currIdx + width;
            while (currIdx < maxRowIdx) {
                colOrig = colOut = this.getARGB(pixels, currIdx);
                idxLeft = currIdx - 1;
                idxRight = currIdx + 1;
                idxUp = currIdx - width;
                idxDown = currIdx + width;
            
                if (idxLeft < currRowIdx) {
                    idxLeft = currIdx;
                }
                if (idxRight >= maxRowIdx) {
                    idxRight = currIdx;
                }
                if (idxUp < 0) {
                    idxUp = 0;
                }
                if (idxDown >= maxIdx) {
                    idxDown = currIdx;
                }
                colUp = this.getARGB(pixels, idxUp);
                colLeft = this.getARGB(pixels, idxLeft);
                colDown = this.getARGB(pixels, idxDown);
                colRight = this.getARGB(pixels, idxRight);
            
                //compute luminance
                currLum =
                    77 * ((colOrig >> 16) & 0xff) +
                    151 * ((colOrig >> 8) & 0xff) +
                    28 * (colOrig & 0xff);
                lumLeft =
                    77 * ((colLeft >> 16) & 0xff) +
                    151 * ((colLeft >> 8) & 0xff) +
                    28 * (colLeft & 0xff);
                lumRight =
                    77 * ((colRight >> 16) & 0xff) +
                    151 * ((colRight >> 8) & 0xff) +
                    28 * (colRight & 0xff);
                lumUp =
                    77 * ((colUp >> 16) & 0xff) +
                    151 * ((colUp >> 8) & 0xff) +
                    28 * (colUp & 0xff);
                lumDown =
                    77 * ((colDown >> 16) & 0xff) +
                    151 * ((colDown >> 8) & 0xff) +
                    28 * (colDown & 0xff);
            
                if (lumLeft > currLum) {
                    colOut = colLeft;
                    currLum = lumLeft;
                }
                if (lumRight > currLum) {
                    colOut = colRight;
                    currLum = lumRight;
                }
                if (lumUp > currLum) {
                    colOut = colUp;
                    currLum = lumUp;
                }
                if (lumDown > currLum) {
                    colOut = colDown;
                    currLum = lumDown;
                }
                out[currIdx++] = colOut;
            }
        }
        this.setPixels(pixels, out);
    };
}
