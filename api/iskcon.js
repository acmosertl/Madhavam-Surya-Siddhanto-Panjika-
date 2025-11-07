// /api/iskcon.js
export default async function handler(req, res) {
  const { date } = req.query || {};
  const IST_OFFSET = 330 * 60 * 1000; // +05:30 IST

  async function fetchISKCON() {
    try {
      const url = 'https://www.vaishnavacalendar.info/iskcon-kolkata.ics';
      const r = await fetch(url, { cache: 'no-store' });
      const text = await r.text();

      // Minimal ICS parser
      const events = [...text.matchAll(/SUMMARY:(.*?)\nDTSTART:(\d{8})/g)]
        .map((m) => ({
          name: m[1].replace(/\s+/g, ' ').trim(),
          date: `${m[2].slice(0, 4)}-${m[2].slice(4, 6)}-${m[2].slice(6, 8)}`,
          type: /Ekadashi/i.test(m[1]) ? 'Ekadashi' : 'Festival',
        }));
      return { ok: true, source: 'ISKCON', events };
    } catch (e) {
      console.error('ISKCON fetch fail:', e);
      return { ok: false, source: 'local', events: [] };
    }
  }

  async function fetchPanchika() {
    try {
      const r = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/update`);
      return await r.json();
    } catch {
      return { data: {} };
    }
  }

  function mergeData(iskcon, panchika) {
    const today = new Date(Date.now() + IST_OFFSET)
      .toISOString()
      .split('T')[0];
    const allEvents = iskcon.events || [];
    const upcoming = allEvents.filter((e) => e.date >= today);
    const todayEvents = allEvents.filter((e) => e.date === today);

    return {
      ok: true,
      updated: new Date().toISOString(),
      source: iskcon.source,
      date: today,
      panchika: panchika.data || {},
      today: todayEvents,
      upcoming: upcoming.slice(0, 5),
    };
  }

  try {
    // Primary fetches
    const [iskcon, panchika] = await Promise.all([fetchISKCON(), fetchPanchika()]);
    const merged = mergeData(iskcon, panchika);

    // Optional date query
    if (date) {
      const todayMatch = merged.upcoming.find((e) => e.date === date);
      merged.date = date;
      merged.today = todayMatch ? [todayMatch] : [];
    }

    res.status(200).json(merged);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
