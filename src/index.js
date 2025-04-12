export default {
  async fetch(request) {
    return new Response("Hello from Care4Paws backend!", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },
};