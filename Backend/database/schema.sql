CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'coordinator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(255),
  discharge_date DATE NOT NULL,
  diagnosis TEXT,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_category VARCHAR(20) NOT NULL CHECK (risk_category IN ('HIGH', 'MEDIUM', 'LOW')),
  status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Follow-up', 'Completed')),
  previous_follow_up TEXT,
  last_contact VARCHAR(100),
  next_action VARCHAR(100),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  coordinator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  next_action VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS call_activities (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  follow_up_id INTEGER NOT NULL REFERENCES follow_ups(id) ON DELETE CASCADE,
  coordinator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  call_outcome VARCHAR(50) NOT NULL CONSTRAINT call_activities_call_outcome_check CHECK (
    call_outcome IN (
      'Successfully Contacted',
      'Call Not Answered',
      'Requested Callback',
      'Follow-Up Required',
      'Auto Discharge',
      'Other'
    )
  ),
  coordinator_notes TEXT NOT NULL,
  next_action VARCHAR(100) CHECK (
    next_action IS NULL OR next_action IN (
      'Complete Follow-Up',
      'Schedule Another Follow-Up',
      'Additional Action Required'
    )
  ),
  ai_summary TEXT,
  ai_guidance TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_risk_category ON patients(risk_category);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_risk_score ON patients(risk_score);
CREATE INDEX IF NOT EXISTS idx_follow_ups_patient_id ON follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_coordinator_id ON follow_ups(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_call_activities_follow_up_id ON call_activities(follow_up_id);
CREATE INDEX IF NOT EXISTS idx_call_activities_coordinator_id ON call_activities(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_call_activities_status ON call_activities(status);

ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;
ALTER TABLE patients
  ADD CONSTRAINT patients_status_check
  CHECK (status IN ('Pending', 'Follow-up', 'Completed'));