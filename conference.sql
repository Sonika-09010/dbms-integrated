  -- =====================================================================
-- AcademiaConf Portal: database schema and queries (MySQL 8 / MariaDB 10.5+)
-- Every table and column comes from the data the React front end keeps today
-- (users, papers, reviews, registrations, announcements, schedules).
-- Sections: 1 Schema | 2 Seed data | 3 Queries by feature | 4 Reports
-- Placeholders written as ? are values your back end passes in (prepared statements).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS academiaconf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academiaconf;

-- =====================================================================
-- 1. SCHEMA
-- =====================================================================

-- Accounts. The front end stores plain-text passwords; here only a hash is stored
-- (bcrypt or argon2 hash made by the back end, never the real password).
CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('Author','Reviewer','Participant','Organizer') NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conference tracks (TRACKS constant in the front end)
CREATE TABLE tracks (
  track_id INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(150) NOT NULL UNIQUE
);

-- Important dates shown on the landing page (IMPORTANT_DATES constant)
CREATE TABLE important_dates (
  date_id    INT AUTO_INCREMENT PRIMARY KEY,
  label      VARCHAR(150) NOT NULL,
  event_date DATE NOT NULL,
  note       VARCHAR(255)
);

-- Papers. status follows the app: Under Review -> Reviewer Accepted / Rejected -> Accepted
-- final_decision is set only by the organizer and protects the decision from late reviews.
CREATE TABLE papers (
  paper_id         INT AUTO_INCREMENT PRIMARY KEY,
  author_id        INT NOT NULL,
  track_id         INT NULL,
  title            VARCHAR(255) NOT NULL,
  abstract         TEXT NOT NULL,
  co_authors       VARCHAR(255) NOT NULL DEFAULT '',
  file_name        VARCHAR(255) NOT NULL DEFAULT '',
  status           ENUM('Under Review','Reviewer Accepted','Rejected','Accepted') NOT NULL DEFAULT 'Under Review',
  final_decision   ENUM('Accepted','Rejected') NULL,
  organizer_approved BOOLEAN NOT NULL DEFAULT FALSE,
  similarity_score TINYINT UNSIGNED NOT NULL DEFAULT 0,       -- plagiarismScore (0 to 100 when real)
  conference_fee   DECIMAL(8,2) NOT NULL DEFAULT 299.00,
  submitted_on     DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT fk_paper_author FOREIGN KEY (author_id) REFERENCES users(user_id),
  CONSTRAINT fk_paper_track  FOREIGN KEY (track_id)  REFERENCES tracks(track_id),
  INDEX idx_paper_status (status),
  INDEX idx_paper_author (author_id)
);

-- Keywords (up to 6 per paper in the form)
CREATE TABLE paper_keywords (
  paper_id INT NOT NULL,
  keyword  VARCHAR(60) NOT NULL,
  PRIMARY KEY (paper_id, keyword),
  FOREIGN KEY (paper_id) REFERENCES papers(paper_id) ON DELETE CASCADE
);

-- Reviews. One review per reviewer per paper (the front end blocks duplicates).
-- This table also gives the Review History tab.
CREATE TABLE reviews (
  review_id   INT AUTO_INCREMENT PRIMARY KEY,
  paper_id    INT NOT NULL,
  reviewer_id INT NOT NULL,
  score       TINYINT NOT NULL,
  confidence  TINYINT NULL,
  comments    TEXT NOT NULL,
  reviewed_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT chk_score      CHECK (score BETWEEN 1 AND 5),
  CONSTRAINT chk_confidence CHECK (confidence IS NULL OR confidence BETWEEN 1 AND 5),
  UNIQUE KEY uq_one_review (paper_id, reviewer_id),
  FOREIGN KEY (paper_id)    REFERENCES papers(paper_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(user_id)
);

-- Program schedule. One slot per paper; two papers cannot share day + time + room.
CREATE TABLE sessions (
  paper_id  INT PRIMARY KEY,
  day_no    TINYINT NOT NULL,                 -- 1, 2, 3
  time_slot ENUM('09:00','10:30','13:00','14:30','16:00') NOT NULL,
  room      VARCHAR(40) NOT NULL,
  CONSTRAINT chk_day CHECK (day_no BETWEEN 1 AND 3),
  UNIQUE KEY uq_slot (day_no, time_slot, room),
  FOREIGN KEY (paper_id) REFERENCES papers(paper_id) ON DELETE CASCADE
);

-- Ticket types (TICKET_TYPES constant): price = paper fee x factor
CREATE TABLE ticket_types (
  ticket_type_id INT AUTO_INCREMENT PRIMARY KEY,
  code   VARCHAR(20) NOT NULL UNIQUE,
  label  VARCHAR(60) NOT NULL,
  factor DECIMAL(3,2) NOT NULL,
  note   VARCHAR(150)
);

-- Promo codes (PROMO_CODES constant)
CREATE TABLE promo_codes (
  code        VARCHAR(30) PRIMARY KEY,
  percent_off TINYINT NOT NULL,
  valid_until DATE NOT NULL,
  CONSTRAINT chk_percent CHECK (percent_off BETWEEN 1 AND 100)
);

-- Registrations. Card details are never stored; only the amount and a transaction id.
CREATE TABLE registrations (
  transaction_id VARCHAR(20) PRIMARY KEY,                -- e.g. TXN-123456
  user_id        INT NOT NULL,
  paper_id       INT NOT NULL,
  ticket_type_id INT NOT NULL,
  participant_name VARCHAR(120) NOT NULL,                -- name printed on badge and certificate
  institution    VARCHAR(150) NOT NULL,
  promo_code     VARCHAR(30) NULL,
  amount_paid    DECIMAL(8,2) NOT NULL,
  registered_on  DATE NOT NULL DEFAULT (CURRENT_DATE),
  checked_in     BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_one_registration (user_id, paper_id),
  FOREIGN KEY (user_id)        REFERENCES users(user_id),
  FOREIGN KEY (paper_id)       REFERENCES papers(paper_id),
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id),
  FOREIGN KEY (promo_code)     REFERENCES promo_codes(code)
);

-- "My Schedule": sessions a participant saved
CREATE TABLE saved_sessions (
  user_id  INT NOT NULL,
  paper_id INT NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, paper_id),
  FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE,
  FOREIGN KEY (paper_id) REFERENCES papers(paper_id) ON DELETE CASCADE
);

-- Organizer announcements
CREATE TABLE announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  title     VARCHAR(100) NOT NULL,
  message   VARCHAR(500) NOT NULL,
  posted_by INT NOT NULL,
  posted_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  FOREIGN KEY (posted_by) REFERENCES users(user_id)
);

-- =====================================================================
-- 2. SEED DATA (same as the front end's starting data)
-- Replace the hash text with real bcrypt hashes made by your back end.
-- =====================================================================

INSERT INTO users (full_name, email, password_hash, role) VALUES
 ('Dr. Alex Morgan',     'alex@university.edu', '<bcrypt-hash>', 'Author'),
 ('Prof. Sarah Jenkins', 'sarah@reviewer.org',  '<bcrypt-hash>', 'Reviewer'),
 ('Sam Wilson',          'sam@gmail.com',       '<bcrypt-hash>', 'Participant'),
 ('Admin Chair',         'admin@event.org',     '<bcrypt-hash>', 'Organizer');

INSERT INTO tracks (name) VALUES
 ('Artificial Intelligence & Machine Learning'),
 ('Systems & Networking'),
 ('Human-Computer Interaction'),
 ('Security & Privacy'),
 ('Data Science & Analytics');

INSERT INTO important_dates (label, event_date, note) VALUES
 ('Paper submission deadline',  '2026-12-15', 'Authors submit title, abstract and manuscript.'),
 ('Review decisions announced', '2027-01-31', 'Reviewers score papers; organizers decide.'),
 ('Early registration closes',  '2027-02-15', 'Use code EARLYBIRD for 10% off.'),
 ('Conference opens',           '2027-03-18', 'Three days of sessions.');

INSERT INTO ticket_types (code, label, factor, note) VALUES
 ('student',  'Student',            0.50, 'Valid student ID required at check-in'),
 ('academic', 'Academic / Author',  1.00, 'Standard registration'),
 ('industry', 'Industry',           1.50, 'Corporate and industry attendees');

INSERT INTO promo_codes (code, percent_off, valid_until) VALUES
 ('EARLYBIRD',  10, '2027-02-15'),
 ('ACADEMIA20', 20, '2027-03-18');

INSERT INTO papers (author_id, track_id, title, abstract, status, final_decision, organizer_approved, similarity_score)
VALUES ((SELECT user_id FROM users WHERE email='alex@university.edu'),
        (SELECT track_id FROM tracks WHERE name LIKE 'Artificial Intelligence%'),
        'AI-Driven Reviewer Assignment Optimization',
        'Explores machine learning algorithms for matching reviewers with academic papers efficiently.',
        'Accepted', 'Accepted', TRUE, 4);

INSERT INTO paper_keywords (paper_id, keyword) VALUES
 (1,'machine learning'), (1,'peer review'), (1,'optimization');

INSERT INTO reviews (paper_id, reviewer_id, score, confidence, comments)
VALUES (1, (SELECT user_id FROM users WHERE email='sarah@reviewer.org'), 5, 4,
        'Excellent methodology and clear benchmarks.');

INSERT INTO announcements (title, message, posted_by)
VALUES ('Call for papers is open',
        'Authors can now submit papers for AcademiaConf 2027.',
        (SELECT user_id FROM users WHERE email='admin@event.org'));

-- =====================================================================
-- 3. QUERIES BY FEATURE
-- =====================================================================

-- ---------- Sign in and register ----------
-- Register (check first that the email is free; the UNIQUE key also enforces it)
INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?);

-- Sign in: fetch the account, then the back end compares the password with the hash
-- and checks that the chosen role equals the stored role
SELECT user_id, full_name, email, password_hash, role
FROM users
WHERE email = ?;

-- ---------- Landing page ----------
SELECT label, event_date, note, DATEDIFF(event_date, CURDATE()) AS days_left
FROM important_dates
ORDER BY event_date;

-- Live counts (papers submitted, accepted, attendees)
SELECT
  (SELECT COUNT(*) FROM papers)                                    AS papers_submitted,
  (SELECT COUNT(*) FROM papers WHERE status='Accepted' AND organizer_approved) AS papers_accepted,
  (SELECT COUNT(*) FROM registrations)                             AS attendees,
  (SELECT COUNT(*) FROM tracks)                                    AS tracks;

-- Tracks with accepted / submitted counts
SELECT t.name,
       SUM(p.status='Accepted' AND p.organizer_approved) AS accepted,
       COUNT(p.paper_id)                                  AS submitted
FROM tracks t
LEFT JOIN papers p ON p.track_id = t.track_id
GROUP BY t.track_id, t.name;

-- Public program: accepted papers in time order
SELECT p.paper_id, p.title, u.full_name AS author, t.name AS track,
       s.day_no, s.time_slot, s.room
FROM papers p
JOIN users u        ON u.user_id = p.author_id
LEFT JOIN tracks t  ON t.track_id = p.track_id
LEFT JOIN sessions s ON s.paper_id = p.paper_id
WHERE p.status = 'Accepted' AND p.organizer_approved
ORDER BY s.day_no IS NULL, s.day_no, s.time_slot, s.room;

-- ---------- Author ----------
-- Submit a paper (similarity_score comes from the plagiarism service)
INSERT INTO papers (author_id, track_id, title, abstract, co_authors, file_name, similarity_score)
VALUES (?, ?, ?, ?, ?, ?, ?);
INSERT INTO paper_keywords (paper_id, keyword) VALUES (?, ?);      -- once per keyword

-- My Papers with search, review count and average score
SELECT p.paper_id, p.title, p.status, p.similarity_score, t.name AS track,
       COUNT(r.review_id) AS review_count, ROUND(AVG(r.score),1) AS avg_score
FROM papers p
LEFT JOIN tracks t  ON t.track_id = p.track_id
LEFT JOIN reviews r ON r.paper_id = p.paper_id
WHERE p.author_id = ?
  AND (p.title LIKE CONCAT('%', ?, '%') OR p.abstract LIKE CONCAT('%', ?, '%'))
GROUP BY p.paper_id, t.name
ORDER BY p.paper_id DESC;

-- Reviewer feedback on one of my papers (reviewer email is not selected, to keep names simple)
SELECT u.full_name AS reviewer, r.score, r.comments
FROM reviews r JOIN users u ON u.user_id = r.reviewer_id
WHERE r.paper_id = ?;

-- ---------- Reviewer ----------
-- Queue with Pending / Evaluated state for this reviewer
SELECT p.paper_id, p.title, u.full_name AS author, t.name AS track,
       (mine.review_id IS NOT NULL) AS evaluated
FROM papers p
JOIN users u        ON u.user_id = p.author_id
LEFT JOIN tracks t  ON t.track_id = p.track_id
LEFT JOIN reviews mine ON mine.paper_id = p.paper_id AND mine.reviewer_id = ?
ORDER BY evaluated, p.paper_id;

-- Submit a review (the UNIQUE key blocks a second review by the same reviewer)
INSERT INTO reviews (paper_id, reviewer_id, score, confidence, comments)
VALUES (?, ?, ?, ?, ?);

-- Update the paper status from the score (original rule: 3 or more = Reviewer Accepted).
-- A late review must not change a paper the organizer already decided.
UPDATE papers
SET status = CASE WHEN ? >= 3 THEN 'Reviewer Accepted' ELSE 'Rejected' END
WHERE paper_id = ? AND final_decision IS NULL;

-- Review history
SELECT r.paper_id, p.title, r.score, r.confidence, r.comments, r.reviewed_on
FROM reviews r JOIN papers p ON p.paper_id = r.paper_id
WHERE r.reviewer_id = ?
ORDER BY r.reviewed_on DESC, r.review_id DESC;

-- ---------- Organizer ----------
-- Papers awaiting a final decision (has reviews, no decision yet)
SELECT p.paper_id, p.title, u.full_name AS author, COUNT(r.review_id) AS reviews,
       ROUND(AVG(r.score),1) AS avg_score, p.similarity_score
FROM papers p
JOIN users u   ON u.user_id = p.author_id
JOIN reviews r ON r.paper_id = p.paper_id
WHERE p.final_decision IS NULL
GROUP BY p.paper_id
ORDER BY p.paper_id;

-- Approve / reject
UPDATE papers SET status='Accepted', organizer_approved=TRUE,  final_decision='Accepted' WHERE paper_id = ?;
UPDATE papers SET status='Rejected', organizer_approved=FALSE, final_decision='Rejected' WHERE paper_id = ?;

-- Assign a session slot (fails with a duplicate-key error if the slot is taken)
INSERT INTO sessions (paper_id, day_no, time_slot, room) VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE day_no = VALUES(day_no), time_slot = VALUES(time_slot), room = VALUES(room);

-- Which paper holds a slot (to show the clash message)
SELECT paper_id FROM sessions WHERE day_no = ? AND time_slot = ? AND room = ? AND paper_id <> ?;

-- Accepted papers that still need a slot
SELECT p.paper_id, p.title
FROM papers p LEFT JOIN sessions s ON s.paper_id = p.paper_id
WHERE p.status='Accepted' AND p.organizer_approved AND s.paper_id IS NULL;

-- Reviewer workload and average score given
SELECT u.full_name, u.email,
       COUNT(r.review_id)      AS evaluations_submitted,
       ROUND(AVG(r.score),1)   AS avg_score_given,
       (SELECT COUNT(*) FROM papers) - COUNT(r.review_id) AS papers_pending
FROM users u
LEFT JOIN reviews r ON r.reviewer_id = u.user_id
WHERE u.role = 'Reviewer'
GROUP BY u.user_id;

-- Attendees with search, and check-in
SELECT g.transaction_id, g.participant_name, u.email, g.institution, p.title AS paper,
       tt.label AS ticket, g.amount_paid, g.promo_code, g.registered_on, g.checked_in
FROM registrations g
JOIN users u         ON u.user_id = g.user_id
JOIN papers p        ON p.paper_id = g.paper_id
JOIN ticket_types tt ON tt.ticket_type_id = g.ticket_type_id
WHERE g.participant_name LIKE CONCAT('%', ?, '%') OR u.email LIKE CONCAT('%', ?, '%')
ORDER BY g.registered_on DESC;

UPDATE registrations SET checked_in = NOT checked_in WHERE transaction_id = ?;

-- Announcements
INSERT INTO announcements (title, message, posted_by) VALUES (?, ?, ?);
DELETE FROM announcements WHERE announcement_id = ?;
SELECT a.announcement_id, a.title, a.message, a.posted_on, u.full_name AS posted_by
FROM announcements a JOIN users u ON u.user_id = a.posted_by
ORDER BY a.announcement_id DESC;

-- ---------- Participant ----------
-- Accepted papers with track filter, my saved and registered state
SELECT p.paper_id, p.title, u.full_name AS author, t.name AS track,
       s.day_no, s.time_slot, s.room,
       (sv.user_id IS NOT NULL) AS saved,
       (rg.transaction_id IS NOT NULL) AS registered
FROM papers p
JOIN users u         ON u.user_id = p.author_id
LEFT JOIN tracks t   ON t.track_id = p.track_id
LEFT JOIN sessions s ON s.paper_id = p.paper_id
LEFT JOIN saved_sessions sv ON sv.paper_id = p.paper_id AND sv.user_id = ?
LEFT JOIN registrations rg  ON rg.paper_id = p.paper_id AND rg.user_id = ?
WHERE p.status = 'Accepted' AND p.organizer_approved
  AND (? IS NULL OR t.name = ?)
ORDER BY s.day_no IS NULL, s.day_no, s.time_slot;

-- Save / remove a session
INSERT IGNORE INTO saved_sessions (user_id, paper_id) VALUES (?, ?);
DELETE FROM saved_sessions WHERE user_id = ? AND paper_id = ?;

-- Price for a ticket with an optional promo code (the back end recomputes it; never trust the browser)
SELECT ROUND(p.conference_fee * tt.factor, 2) AS base_price,
       ROUND(p.conference_fee * tt.factor * (1 - IFNULL(pc.percent_off,0)/100), 2) AS total
FROM papers p
JOIN ticket_types tt ON tt.code = ?
LEFT JOIN promo_codes pc ON pc.code = ? AND pc.valid_until >= CURDATE()
WHERE p.paper_id = ?;

-- Register (the UNIQUE key blocks a second registration for the same paper)
INSERT INTO registrations
  (transaction_id, user_id, paper_id, ticket_type_id, participant_name, institution, promo_code, amount_paid)
VALUES (?, ?, ?, (SELECT ticket_type_id FROM ticket_types WHERE code = ?), ?, ?, ?, ?);

-- Certificate and badge data
SELECT g.transaction_id, g.participant_name, g.institution, p.title AS paper, tt.label AS ticket
FROM registrations g
JOIN papers p        ON p.paper_id = g.paper_id
JOIN ticket_types tt ON tt.ticket_type_id = g.ticket_type_id
WHERE g.user_id = ?;

-- ---------- Notifications ----------
-- Author: new reviews on my papers
SELECT p.title, u.full_name AS reviewer, r.score, r.reviewed_on
FROM reviews r
JOIN papers p ON p.paper_id = r.paper_id
JOIN users u  ON u.user_id = r.reviewer_id
WHERE p.author_id = ?
ORDER BY r.reviewed_on DESC;

-- =====================================================================
-- 4. REPORTS (Organizer > Reports)
-- =====================================================================

-- Totals
SELECT
  SUM(p.status='Accepted' AND p.organizer_approved) AS accepted,
  COUNT(*)                                           AS submitted
FROM papers p;

SELECT IFNULL(SUM(amount_paid),0) AS total_revenue,
       COUNT(*)                   AS attendees,
       SUM(checked_in)            AS checked_in
FROM registrations;

SELECT ROUND(AVG(score),1) AS avg_review_score, COUNT(*) AS total_reviews FROM reviews;

-- Submissions by status
SELECT status, COUNT(*) AS papers FROM papers GROUP BY status;

-- Submissions by track
SELECT t.name, COUNT(p.paper_id) AS papers
FROM tracks t LEFT JOIN papers p ON p.track_id = t.track_id
GROUP BY t.track_id, t.name
HAVING papers > 0;

-- Registrations by ticket type
SELECT tt.label, COUNT(g.transaction_id) AS registrations, IFNULL(SUM(g.amount_paid),0) AS revenue
FROM ticket_types tt LEFT JOIN registrations g ON g.ticket_type_id = tt.ticket_type_id
GROUP BY tt.ticket_type_id, tt.label;

-- CSV export of papers (run with SELECT ... INTO OUTFILE or from the back end)
SELECT p.paper_id, p.title, t.name AS track, u.full_name AS author, u.email, p.status,
       p.similarity_score, COUNT(r.review_id) AS reviews, ROUND(AVG(r.score),1) AS avg_score
FROM papers p
JOIN users u        ON u.user_id = p.author_id
LEFT JOIN tracks t  ON t.track_id = p.track_id
LEFT JOIN reviews r ON r.paper_id = p.paper_id
GROUP BY p.paper_id, t.name, u.full_name, u.email;