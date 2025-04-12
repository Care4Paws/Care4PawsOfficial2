export default {
  async fetch(request) {
    return new Response("Hello from Care4Paws!", {
      headers: { "content-type": "text/plain" },
    });
  },
};