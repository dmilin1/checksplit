let baseURL = ''
if (process.env.NODE_ENV === 'development') {
	baseURL = `${window.location.protocol}//${window.location.host.split(':')[0]}:8080`
} else {
    baseURL = `${window.location.protocol}//${window.location.host}/`
}

export default {
    baseURL
}