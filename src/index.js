addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  return new Response('Hello from Care4Paws!', {
    headers: { 'content-type': 'text/plain' },
  })
}