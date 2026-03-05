import { getDb } from '../db/init.js';

/**
 * Disruption Model
 */
class Disruption {
  static create(data) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO disruptions (type, title, severity, affected_routes, affected_transport_modes, impact_description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.type,
          data.title,
          data.severity,
          JSON.stringify(data.affected_routes || []),
          JSON.stringify(data.affected_transport_modes || []),
          data.impact_description
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get('SELECT * FROM disruptions WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else if (!row) resolve(null);
        else {
          try {
            row.affected_routes = JSON.parse(row.affected_routes);
            row.affected_transport_modes = JSON.parse(row.affected_transport_modes || '[]');
          } catch (e) {
            console.error('Error parsing JSON in Disruption:', e);
          }
          resolve(row);
        }
      });
    });
  }

  static getActive() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all('SELECT * FROM disruptions WHERE is_active = 1 ORDER BY triggered_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else {
          rows.forEach(r => {
            try {
              r.affected_routes = JSON.parse(r.affected_routes);
              r.affected_transport_modes = JSON.parse(r.affected_transport_modes || '[]');
            } catch (e) {
              console.error('Error parsing JSON in Disruption list:', e);
            }
          });
          resolve(rows);
        }
      });
    });
  }

  static resolve(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        'UPDATE disruptions SET is_active = 0, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }
}

export default Disruption;
