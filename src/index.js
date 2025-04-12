export default {
  async fetch(request) {
    if (request.method === "GET") {
      return new Response("Hello from Care4Paws backend!", { status: 200 });
    } else if (request.method === "POST") {
      const requestBody = await request.text(); // Read the POST body
      return new Response(`You sent: ${requestBody}`, { status: 201 });
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  },
};