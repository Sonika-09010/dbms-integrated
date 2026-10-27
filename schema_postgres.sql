-- =====================================================================
-- AcademiaConf Portal: Supabase PostgreSQL Schema & Initial Seed Data
-- Converted from MySQL schema (conference.sql) to PostgreSQL (Supabase)
-- =====================================================================

-- Drop tables if re-running (in dependency order)
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS saved_sessions CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS paper_keywords CASCADE;
DROP TABLE IF EXISTS papers CASCADE;
DROP TABLE IF EXISTS important_dates CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================================
-- 1. TABLES & SCHEMAS
-- =====================================================================

-- 1. Users table (Authors, Reviewers, Participants, Organizers)
CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('Author', 'Reviewer', 'Participant', 'Organizer')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Conference Tracks
CREATE TABLE tracks (
    track_id SERIAL PRIMARY KEY,
    name     VARCHAR(150) NOT NULL UNIQUE
);

-- 3. Important Dates (shown on landing page)
CREATE TABLE important_dates (
    date_id    SERIAL PRIMARY KEY,
    label      VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    note       VARCHAR(255)
);

-- 4. Papers table
CREATE TABLE papers (
    paper_id           SERIAL PRIMARY KEY,
    author_id          INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    track_id           INT REFERENCES tracks(track_id) ON DELETE SET NULL,
    title              VARCHAR(255) NOT NULL,
    abstract           TEXT NOT NULL,
    co_authors         VARCHAR(255) NOT NULL DEFAULT '',
    file_name          VARCHAR(255) NOT NULL DEFAULT '',
    status             VARCHAR(30) NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Under Review', 'Reviewer Accepted', 'Rejected', 'Accepted')),
    final_decision     VARCHAR(20) NULL CHECK (final_decision IS NULL OR final_decision IN ('Accepted', 'Rejected')),
    organizer_approved BOOLEAN NOT NULL DEFAULT FALSE,
    similarity_score   SMALLINT NOT NULL DEFAULT 0,
    conference_fee     DECIMAL(8,2) NOT NULL DEFAULT 299.00,
    submitted_on       DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_paper_status ON papers(status);
CREATE INDEX idx_paper_author ON papers(author_id);

-- 5. Paper Keywords
CREATE TABLE paper_keywords (
    paper_id INT NOT NULL REFERENCES papers(paper_id) ON DELETE CASCADE,
    keyword  VARCHAR(60) NOT NULL,
    PRIMARY KEY (paper_id, keyword)
);

-- 6. Paper Reviews
CREATE TABLE reviews (
    review_id   SERIAL PRIMARY KEY,
    paper_id    INT NOT NULL REFERENCES papers(paper_id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    score       SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    confidence  SMALLINT NULL CHECK (confidence IS NULL OR confidence BETWEEN 1 AND 5),
    comments    TEXT NOT NULL,
    reviewed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT uq_one_review UNIQUE (paper_id, reviewer_id)
);

-- 7. Program Sessions (Schedule)
CREATE TABLE sessions (
    paper_id  INT PRIMARY KEY REFERENCES papers(paper_id) ON DELETE CASCADE,
    day_no    SMALLINT NOT NULL CHECK (day_no BETWEEN 1 AND 3),
    time_slot VARCHAR(10) NOT NULL CHECK (time_slot IN ('09:00', '10:30', '13:00', '14:30', '16:00')),
    room      VARCHAR(40) NOT NULL,
    CONSTRAINT uq_slot UNIQUE (day_no, time_slot, room)
);

-- 8. Ticket Types
CREATE TABLE ticket_types (
    ticket_type_id SERIAL PRIMARY KEY,
    code           VARCHAR(20) NOT NULL UNIQUE,
    label          VARCHAR(60) NOT NULL,
    factor         DECIMAL(3,2) NOT NULL,
    note           VARCHAR(150)
);

-- 9. Promo Codes
CREATE TABLE promo_codes (
    code        VARCHAR(30) PRIMARY KEY,
    percent_off SMALLINT NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
    valid_until DATE NOT NULL
);

-- 10. Registrations
CREATE TABLE registrations (
    transaction_id   VARCHAR(20) PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    paper_id         INT NOT NULL REFERENCES papers(paper_id) ON DELETE CASCADE,
    ticket_type_id   INT NOT NULL REFERENCES ticket_types(ticket_type_id),
    participant_name VARCHAR(120) NOT NULL,
    institution      VARCHAR(150) NOT NULL,
    promo_code       VARCHAR(30) NULL REFERENCES promo_codes(code) ON DELETE SET NULL,
    amount_paid      DECIMAL(8,2) NOT NULL,
    registered_on    DATE NOT NULL DEFAULT CURRENT_DATE,
    checked_in       BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_one_registration UNIQUE (user_id, paper_id)
);

-- 11. Saved Sessions (Participant personalized schedule)
CREATE TABLE saved_sessions (
    user_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    paper_id INT NOT NULL REFERENCES papers(paper_id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, paper_id)
);

-- 12. Announcements
CREATE TABLE announcements (
    announcement_id SERIAL PRIMARY KEY,
    title           VARCHAR(100) NOT NULL,
    message         VARCHAR(500) NOT NULL,
    posted_by       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    posted_on       DATE NOT NULL DEFAULT CURRENT_DATE
);

-- =====================================================================
-- 2. SEED DATA
-- Default password for all seed accounts is: password123
-- =====================================================================

INSERT INTO users (full_name, email, password_hash, role) VALUES
 ('Dr. Alex Morgan',     'alex@university.edu', '$2b$10$diDVMguwz9o37RW36CRPGue7EekBjL7iHT.NW0GAX.XH5bKmLC7ku', 'Author'),
 ('Prof. Sarah Jenkins', 'sarah@reviewer.org',  '$2b$10$diDVMguwz9o37RW36CRPGue7EekBjL7iHT.NW0GAX.XH5bKmLC7ku', 'Reviewer'),
 ('Sam Wilson',          'sam@gmail.com',       '$2b$10$diDVMguwz9o37RW36CRPGue7EekBjL7iHT.NW0GAX.XH5bKmLC7ku', 'Participant'),
 ('Admin Chair',         'admin@event.org',     '$2b$10$diDVMguwz9o37RW36CRPGue7EekBjL7iHT.NW0GAX.XH5bKmLC7ku', 'Organizer');

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
VALUES (
    (SELECT user_id FROM users WHERE email='alex@university.edu'),
    (SELECT track_id FROM tracks WHERE name LIKE 'Artificial Intelligence%'),
    'AI-Driven Reviewer Assignment Optimization',
    'Explores machine learning algorithms for matching reviewers with academic papers efficiently.',
    'Accepted', 'Accepted', TRUE, 4
);

INSERT INTO paper_keywords (paper_id, keyword) VALUES
 (1, 'machine learning'),
 (1, 'peer review'),
 (1, 'optimization');

INSERT INTO reviews (paper_id, reviewer_id, score, confidence, comments)
VALUES (
    1,
    (SELECT user_id FROM users WHERE email='sarah@reviewer.org'),
    5,
    4,
    'Excellent methodology and clear benchmarks.'
);

INSERT INTO announcements (title, message, posted_by)
VALUES (
    'Call for papers is open',
    'Authors can now submit papers for AcademiaConf 2027.',
    (SELECT user_id FROM users WHERE email='admin@event.org')
);
