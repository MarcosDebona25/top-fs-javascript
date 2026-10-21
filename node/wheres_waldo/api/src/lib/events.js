// Fan-out of leaderboard changes to the browsers connected over Server-Sent Events.
class LeaderboardEvents {
  constructor({ heartbeatMs }) {
    this.heartbeatMs = heartbeatMs;
    this.clients = new Set();
  }

  subscribe(req, res) {
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // keep nginx from buffering the stream
    });
    res.flushHeaders();
    res.write('retry: 5000\n: connected\n\n');

    // A comment line is ignored by EventSource but keeps proxies from closing an idle connection.
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), this.heartbeatMs);
    heartbeat.unref();
    const client = { res, heartbeat };
    this.clients.add(client);
    req.on('close', () => this.remove(client));
  }

  remove(client) {
    clearInterval(client.heartbeat);
    this.clients.delete(client);
  }

  publish(payload) {
    const message = `event: leaderboard\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const { res } of this.clients) res.write(message);
  }

  closeAll() {
    for (const client of [...this.clients]) {
      this.remove(client);
      client.res.end();
    }
  }
}

module.exports = { LeaderboardEvents };
