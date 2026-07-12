-- Enums
CREATE TYPE vehicle_status AS ENUM ('AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED');
CREATE TYPE driver_status AS ENUM ('AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED');
CREATE TYPE trip_status AS ENUM ('DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE maint_status AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE expense_type AS ENUM ('TOLL', 'MAINTENANCE', 'PARKING', 'INSURANCE', 'PERMIT', 'OTHER');
CREATE TYPE user_role AS ENUM ('FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'DRIVER',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  max_load_capacity DECIMAL(10,2) NOT NULL CHECK (max_load_capacity > 0),
  odometer DECIMAL(10,2) DEFAULT 0 CHECK (odometer >= 0),
  acquisition_cost DECIMAL(12,2) NOT NULL CHECK (acquisition_cost >= 0),
  status vehicle_status DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_category TEXT NOT NULL,
  license_expiry_date DATE NOT NULL,
  contact_number TEXT NOT NULL,
  safety_score DECIMAL(5,2) DEFAULT 0 CHECK (safety_score BETWEEN 0 AND 100),
  status driver_status DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_code TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  driver_id UUID REFERENCES drivers(id) NOT NULL,
  cargo_weight DECIMAL(10,2) NOT NULL CHECK (cargo_weight > 0),
  planned_distance DECIMAL(10,2) NOT NULL CHECK (planned_distance > 0),
  actual_distance DECIMAL(10,2) CHECK (actual_distance IS NULL OR actual_distance >= 0),
  status trip_status DEFAULT 'DRAFT',
  start_odometer DECIMAL(10,2) CHECK (start_odometer IS NULL OR start_odometer >= 0),
  end_odometer DECIMAL(10,2) CHECK (end_odometer IS NULL OR end_odometer >= 0),
  CHECK (
    start_odometer IS NULL OR
    end_odometer IS NULL OR
    end_odometer >= start_odometer
  ),
  fuel_consumed DECIMAL(10,2) CHECK (fuel_consumed IS NULL OR fuel_consumed >= 0),
  revenue DECIMAL(12,2) DEFAULT 0 CHECK (revenue >= 0),
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
  status maint_status DEFAULT 'OPEN',
  scheduled_date DATE,
  completed_date DATE,
  CHECK (
    completed_date IS NULL OR
    scheduled_date IS NULL OR
    completed_date >= scheduled_date
  ),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  liters DECIMAL(10,2) NOT NULL CHECK (liters > 0),
  cost_per_liter DECIMAL(10,2) NOT NULL CHECK (cost_per_liter >= 0),
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (liters * cost_per_liter) STORED,
  logged_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  type expense_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry_date);
CREATE INDEX idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_trips_created ON trips(created_at);
CREATE INDEX idx_trips_completed ON trips(completed_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
