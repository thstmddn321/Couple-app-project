const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const dayjs = require('dayjs'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_mysql_user', // your_mysql_user 직접 수정
  password: 'your_mysql_password', // your_mysql_password 직접 수정
  database: 'couple_app'
});

db.connect(err => {
  if (err) console.error('DB 연결 실패:', err);
  else console.log('MySQL 연결 성공!');
});

const hashPassword = (pw) => crypto.createHash('md5').update(pw).digest('hex');


app.post('/register', (req, res) => {
  const { name, email, password, sex } = req.body;
  const sql = 'INSERT INTO member (name, email, password, sex) VALUES (?, ?, ?, ?)';

  const sexEnum = sex === 'male' ? 'M' : (sex === 'female' ? 'F' : null);
  if (!sexEnum) {
    return res.status(400).send('성별 입력이 잘못되었습니다.');
  }

  db.query(sql, [name, email, hashPassword(password), sexEnum], (err) => {
    if (err) res.status(500).send('회원가입 실패');
    else res.send('회원가입 성공');
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT member_id FROM member WHERE email = ? AND password = ? LIMIT 1';
  db.query(sql, [email, hashPassword(password)], (err, results) => {
    if (err) return res.status(500).send('로그인 실패');
    if (results.length > 0)
      res.json({ success: true, memberId: results[0].member_id });
    else
      res.json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
  });
});



app.post('/couple/insert', (req, res) => {
  const { maleId, femaleId, coupleDate } = req.body;
  if (!maleId || !femaleId) return res.status(400).json({ success: false });

  const sql = 'INSERT INTO couple (male_id, female_id, couple_date, total_distance, coins, share_location) VALUES (?, ?, ?, ?, ?, ?)';
db.query(sql, [maleId, femaleId, coupleDate || null, 0, 200, 1], (err, result) => {
  if (err) {
    console.error(err);
    res.status(500).json({ success: false });
  } else {
    res.json({ success: true, coupleId: result.insertId });
  }
  });
});


function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}


async function visitCheckForMember(memberId) {
  return new Promise((resolve) => {
    const sqlCouple = `SELECT couple_id, male_id, female_id FROM couple WHERE male_id = ? OR female_id = ?`;
    db.query(sqlCouple, [memberId, memberId], (err, couples) => {
      if (err || !couples.length) return resolve(false);
      const { couple_id, male_id, female_id } = couples[0];
      const partnerId = (male_id === +memberId) ? female_id : male_id;

      const todayDate = dayjs().format('YYYY-MM-DD');

  
      const checkVisitSql = `
        SELECT * FROM couple_visit
        WHERE couple_id = ? AND visit_date = ?
      `;
      db.query(checkVisitSql, [couple_id, todayDate], (errCheck, resultCheck) => {
        if (errCheck) return resolve(false);
        if (resultCheck.length > 0) return resolve(false); 

        const since = dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss');
        const sqlLog = `
          SELECT member_id, latitude, longitude, UNIX_TIMESTAMP(timestamp) AS ts
          FROM location_log
          WHERE (member_id = ? OR member_id = ?) AND timestamp >= ?
          ORDER BY timestamp
        `;
        db.query(sqlLog, [memberId, partnerId, since], (err2, logs) => {
          if (err2) return resolve(false);
          const userLogs = logs.filter(l => l.member_id === +memberId);
          const partnerLogs = logs.filter(l => l.member_id === partnerId);

          const THRESHOLD_DIST = 50;
          const TIME_WINDOW = 300;
          const SESSION_GAP = 600;

          let sessions = [];
          let currentSession = null;
          let j = 0;

          for (let i = 0; i < userLogs.length; i++) {
            const u = userLogs[i];
            while (j < partnerLogs.length && partnerLogs[j].ts < u.ts - TIME_WINDOW) j++;
            for (let k = j; k < partnerLogs.length; k++) {
              const p = partnerLogs[k];
              if (p.ts > u.ts + TIME_WINDOW) break;

              const dist = haversineDistance(u.latitude, u.longitude, p.latitude, p.longitude);
              if (dist <= THRESHOLD_DIST) {
                if (!currentSession) {
                  currentSession = { start: u.ts, end: u.ts };
                } else if (u.ts - currentSession.end > SESSION_GAP) {
                  sessions.push(currentSession);
                  currentSession = { start: u.ts, end: u.ts };
                } else {
                  currentSession.end = u.ts;
                }
                break;
              }
            }
          }
          if (currentSession) sessions.push(currentSession);
          if (!sessions.length) return resolve(false);

          let totalTogetherSeconds = 0;
          let totalTogetherDistance = 0;

          sessions.forEach(session => {
            const sessionLogs = userLogs.filter(l => l.ts >= session.start && l.ts <= session.end);
            if (sessionLogs.length < 2) return;

            let sessionDistance = 0;
            for (let i = 1; i < sessionLogs.length; i++) {
              const d = haversineDistance(
                sessionLogs[i-1].latitude, sessionLogs[i-1].longitude,
                sessionLogs[i].latitude, sessionLogs[i].longitude
              );
              if (d < 500) sessionDistance += d;
            }
            const sessionSeconds = session.end - session.start;
            if (sessionSeconds >= 30) {
              totalTogetherSeconds += sessionSeconds;
              totalTogetherDistance += sessionDistance;
            }
          });

          if (totalTogetherSeconds < 30) return resolve(false);
          const finalDistance = Math.floor(totalTogetherDistance);

          const insertSql = `
            INSERT INTO couple_visit (couple_id, visit_date, latitude, longitude, stayed_seconds, distance)
            VALUES (?, ?, 0, 0, ?, ?)
          `;
          db.query(insertSql, [couple_id, todayDate, totalTogetherSeconds, finalDistance], () => {
            const updateDistance = `UPDATE couple SET total_distance = total_distance + ? WHERE couple_id = ?`;
            db.query(updateDistance, [finalDistance, couple_id]);

            const coinsToAdd = 10 + Math.floor(finalDistance / 1000);
            const updateCoins = `UPDATE couple SET coins = coins + ? WHERE couple_id = ?`;
            db.query(updateCoins, [coinsToAdd, couple_id]);

            return resolve(true);
          });
        });
      });
    });
  });
}



app.post('/location/update', (req, res) => {
  const { memberId, latitude, longitude } = req.body;
  if (!memberId || !latitude || !longitude) return res.status(400).json({ success: false });

  const sql = `INSERT INTO location_log (member_id, latitude, longitude, timestamp)
               VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL 9 HOUR))`;
  db.query(sql, [memberId, latitude, longitude], async (err) => {
    if (err) return res.status(500).json({ success: false });

    const visited = await visitCheckForMember(memberId);
    if (visited)
      res.json({ success: true, message: '방문 기록 생성됨' });
    else
      res.json({ success: true, message: '위치 기록됨' });
  });
});



app.get('/pet/:memberId/status', (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const sql = `SELECT * FROM member_pet WHERE member_id = ?`;
  db.query(sql, [memberId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    if (results.length === 0) {
      const insertSql = `INSERT INTO member_pet (member_id) VALUES (?)`;
      db.query(insertSql, [memberId], () => {
        res.json({ success: true, equipped_carpet: null, equipped_house: null });
      });
    } else {
      res.json({
        success: true,
        equipped_carpet: results[0].equipped_carpet,
        equipped_house: results[0].equipped_house
      });
    }
  });
});

app.get('/shop/items', (req, res) => {
  const sql = `SELECT * FROM shop_items`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, items: results });
  });
});

app.post('/shop/buy', (req, res) => {
  const { memberId, itemId } = req.body;

  const getItemSql = `SELECT * FROM shop_items WHERE item_id = ?`;
  db.query(getItemSql, [itemId], (err, itemResults) => {
    if (err || itemResults.length === 0)
      return res.status(400).json({ success: false });

    const item = itemResults[0];
    const price = item.price;
    const category = item.category;
    const itemName = item.item_name;

    const getCoinSql = `SELECT couple_id, male_id, female_id, coins FROM couple WHERE male_id = ? OR female_id = ?`;
    db.query(getCoinSql, [memberId, memberId], (err2, coupleResults) => {
      if (err2 || coupleResults.length === 0)
        return res.status(400).json({ success: false });

      const couple = coupleResults[0];
      if (couple.coins < price)
        return res.json({ success: false, message: "코인 부족" });

      const updateCoinSql = `UPDATE couple SET coins = coins - ? WHERE couple_id = ?`;
      db.query(updateCoinSql, [price, couple.couple_id]);

      const insertInvSql = `INSERT IGNORE INTO pet_item_inventory (member_id, item_id) VALUES (?, ?)`;
      db.query(insertInvSql, [couple.male_id, itemId]);
      db.query(insertInvSql, [couple.female_id, itemId]);

      const updatePetSql = `
        INSERT INTO member_pet (member_id, ${category === 'carpet' ? 'equipped_carpet' : 'equipped_house'})
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE ${category === 'carpet' ? 'equipped_carpet' : 'equipped_house'} = ?
      `;

      db.query(updatePetSql, [memberId, itemName, itemName]);

      const partnerId = (couple.male_id === memberId) ? couple.female_id : couple.male_id;
      db.query(updatePetSql, [partnerId, itemName, itemName]);

      
      return res.json({ success: true, message: "구매 성공", applied: itemName });
    });
  });
});




app.get('/couple/:memberId/status', (req, res) => {
  const memberId = parseInt(req.params.memberId);

  const findCoupleSql = `
    SELECT couple_id, total_distance, coins 
    FROM couple 
    WHERE male_id = ? OR female_id = ?
  `;

  db.query(findCoupleSql, [memberId, memberId], (err, coupleResults) => {
    if (err || coupleResults.length === 0) return res.json({ success: false });

    const couple = coupleResults[0];
    const coupleId = couple.couple_id;

    const togetherTimeSql = `
      SELECT IFNULL(SUM(stayed_seconds), 0) AS total_seconds 
      FROM couple_visit 
      WHERE couple_id = ? 
        AND YEAR(visit_date) = YEAR(CURDATE()) 
        AND MONTH(visit_date) = MONTH(CURDATE())
    `;

    db.query(togetherTimeSql, [coupleId], (err2, timeResults) => {
      if (err2) return res.json({ success: false });

      const totalSeconds = timeResults[0].total_seconds;
      const togetherTimeMinutes = Math.floor(totalSeconds / 60);

      res.json({
        success: true,
        totalDistance: couple.total_distance,
        coins: couple.coins,
        togetherTime: togetherTimeMinutes
      });
    });
  });
});


app.post('/couple/insertDate', (req, res) => {
  const { memberId, coupleDate } = req.body;
  const findSql = `SELECT couple_id FROM couple WHERE male_id = ? OR female_id = ?`;
  db.query(findSql, [memberId, memberId], (err, results) => {
    if (err || !results.length) {
      return res.status(404).json({ success: false, message: '커플이 등록되어 있지 않습니다.' });
    }
    const coupleId = results[0].couple_id;
    const updateSql = `UPDATE couple SET couple_date = ? WHERE couple_id = ?`;
    db.query(updateSql, [coupleDate, coupleId], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: '날짜 등록 실패' });
      return res.json({ success: true, message: '사귄 날짜 등록 완료!' });
    });
  });
});

app.post('/couple/updateDate', (req, res) => {
  const { memberId, coupleDate } = req.body;
  const findSql = `SELECT couple_id FROM couple WHERE male_id = ? OR female_id = ?`;
  db.query(findSql, [memberId, memberId], (err, results) => {
    if (err || !results.length) {
      return res.status(404).json({ success: false, message: '커플이 등록되어 있지 않습니다.' });
    }
    const coupleId = results[0].couple_id;
    const updateSql = `UPDATE couple SET couple_date = ? WHERE couple_id = ?`;
    db.query(updateSql, [coupleDate, coupleId], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: '날짜 수정 실패' });
      return res.json({ success: true, message: '사귄 날짜 수정 완료!' });
    });
  });
});


app.get('/couple/:memberId', (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const query = `SELECT couple_id, couple_date FROM couple WHERE male_id = ? OR female_id = ?`;

  db.query(query, [memberId, memberId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    if (results.length === 0)
      return res.json({ success: false, message: '커플 정보 없음' });

    const couple = results[0];
    const coupleId = couple.couple_id;

    const countQuery = `
  SELECT COUNT(DISTINCT visit_date) AS meetingCount 
  FROM couple_visit 
  WHERE couple_id = ? 
    AND YEAR(visit_date) = YEAR(CURDATE()) 
    AND MONTH(visit_date) = MONTH(CURDATE())
`;
    db.query(countQuery, [coupleId], (err2, countResults) => {
      if (err2) return res.status(500).json({ success: false });

      res.json({
        success: true,
        coupleDate: couple.couple_date,
        meetingCount: countResults[0].meetingCount
      });
    });
  });
});


app.get('/couple/:memberId/badges', (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const query = `SELECT couple_id, couple_date, total_distance FROM couple WHERE male_id = ? OR female_id = ?`;

  db.query(query, [memberId, memberId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    if (results.length === 0)
      return res.json({ success: false });

    const couple = results[0];
    const coupleId = couple.couple_id;

    const visitQuery = `
      SELECT 
        COUNT(DISTINCT visit_date) AS meetingCount,
        IFNULL(SUM(stayed_seconds), 0) AS total_seconds 
      FROM couple_visit 
      WHERE couple_id = ? 
        AND YEAR(visit_date) = YEAR(CURDATE()) 
        AND MONTH(visit_date) = MONTH(CURDATE())
    `;
    db.query(visitQuery, [coupleId], (err2, visitResults) => {
      if (err2) return res.status(500).json({ success: false });

      const daysTogether = couple.couple_date ? dayjs().diff(dayjs(couple.couple_date), 'day') : 0;
      res.json({
        hasFirstVisit: daysTogether >= 1,
        daysTogether,
        totalDistance: couple.total_distance,
        togetherTimeMinutes: Math.floor(visitResults[0].total_seconds / 60),
        monthlyMeetingCount: visitResults[0].meetingCount
      });
    });
  });
});


app.get('/member/:memberId/sharing', (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const sql = `SELECT sharing FROM member WHERE member_id = ?`;
  db.query(sql, [memberId], (err, results) => {
    if (err || results.length === 0) return res.json({ success: false });
    res.json({ success: true, sharing: !!results[0].sharing });
  });
});

app.post('/member/:memberId/sharing', (req, res) => {
  const memberId = parseInt(req.params.memberId);
  const { sharing } = req.body;
  const sql = `UPDATE member SET sharing = ? WHERE member_id = ?`;
  db.query(sql, [sharing ? 1 : 0, memberId], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});


app.get('/couple/:memberId/partner', (req, res) => {
  const memberId = parseInt(req.params.memberId);

  const sqlCouple = `SELECT couple_id, male_id, female_id FROM couple WHERE male_id = ? OR female_id = ?`;
  db.query(sqlCouple, [memberId, memberId], (err, coupleResults) => {
    if (err || coupleResults.length === 0) {
      return res.status(404).json({ success: false, message: "커플 정보 없음" });
    }
    const { male_id, female_id } = coupleResults[0];
    const partnerId = (male_id === memberId) ? female_id : male_id;

    const sqlSharing = `SELECT sharing FROM member WHERE member_id = ?`;
    db.query(sqlSharing, [partnerId], (err2, sharingResults) => {
      if (err2 || sharingResults.length === 0) {
        return res.status(404).json({ success: false, message: "상대방 정보 없음" });
      }
      if (sharingResults[0].sharing !== 1) {
        return res.json({ success: true, visible: false });
      }

      const sqlLocation = `
        SELECT latitude, longitude, timestamp 
        FROM location_log 
        WHERE member_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `;
      db.query(sqlLocation, [partnerId], (err3, locationResults) => {
        if (err3 || locationResults.length === 0) {
          return res.json({ success: true, visible: true, location: null });
        }

        res.json({
          success: true,
          visible: true,
          location: {
            latitude: locationResults[0].latitude,
            longitude: locationResults[0].longitude,
            timestamp: locationResults[0].timestamp
          }
        });
      });
    });
  });
});



app.listen(port, () => {
  console.log(`서버 실행중: http://localhost:${port}`);
});