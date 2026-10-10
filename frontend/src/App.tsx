import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  askSchoolAssistant,
  fetchTeachers,
  getAdminMe,
  listAdmissionsAdmin,
  listInquiriesAdmin,
  loginAdmin,
  logoutAdmin,
  submitAdmission,
  submitInquiry,
  updateAdmissionStatus,
  updateInquiryStatus,
} from './api';

type Teacher = {
  id: number;
  name: string;
  subject: string;
  qualifications: string;
  years_of_experience: number;
  bio: string;
};

type Inquiry = {
  id: number;
  name: string;
  contact_details: string;
  role: string;
  grade: string;
  message: string;
  status: string;
  created_at: string;
};

type Admission = {
  id: number;
  applicant_name: string;
  contact_details: string;
  child_name: string;
  grade: string;
  message: string;
  status: string;
  created_at: string;
};

const courseData = [
  {
    className: 'Classes 6-7',
    description: 'Strong foundations in language, mathematics, science, and social studies with inquiry-based learning.',
    subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Basics'],
  },
  {
    className: 'Classes 8-9',
    description: 'Concept-driven learning with specialist teachers and project work to prepare students for board-level expectations.',
    subjects: ['English', 'Hindi', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Science'],
  },
  {
    className: 'Class 10',
    description: 'Board-focused academic preparation with exam readiness, mentoring, and subject-specific guidance.',
    subjects: ['English', 'Hindi', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Science', 'Life Skills'],
  },
];

const teacherPlaceholderImages = [
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=240&h=240&q=80',
];

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/courses', label: 'Courses' },
  { to: '/inquiries', label: 'Student Inquiries' },
  { to: '/admission', label: 'Admission' },
  { to: '/teachers', label: 'Teachers' },
  { to: '/admin', label: 'Admin' },
];

type ChatMessage = {
  id: number;
  role: 'assistant' | 'visitor';
  text: string;
};

function SchoolChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Hello! I can help with school fees, class timings, and course details. What would you like to know?',
    },
  ]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, isOpen, isSending]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (question: string) => {
    const text = question.trim();
    if (!text || isSending) return;

    setDraft('');
    setMessages((current) => [...current, { id: Date.now(), role: 'visitor', text }]);
    setIsSending(true);
    try {
      const previousAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')?.text;
      const previousVisitorQuestion = [...messages].reverse().find((message) => message.role === 'visitor')?.text;
      const previousQuestion = previousAssistantMessage?.toLowerCase().includes('which class')
        ? previousVisitorQuestion
        : undefined;
      const response = await askSchoolAssistant(text, previousQuestion);
      setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', text: response.data.answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', text: 'I could not reach the school information service. Please try again shortly.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="school-chat">
      {isOpen ? (
        <section className="chat-panel" role="dialog" aria-label="School information assistant">
          <header className="chat-header">
            <div className="chat-brand-mark" aria-hidden="true">G</div>
            <div className="chat-heading">
              <strong>School assistant</strong>
              <span>Fees, timings, and courses</span>
            </div>
            <button className="chat-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close chat">
              Close
            </button>
          </header>
          <div className="chat-transcript" ref={transcriptRef} role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((message) => (
              <p key={message.id} className={`chat-message ${message.role}`}>
                {message.text}
              </p>
            ))}
            {isSending ? <p className="chat-message assistant chat-typing">Checking the school information...</p> : null}
          </div>
          {messages.length === 1 ? (
            <div className="chat-suggestions" aria-label="Suggested questions">
              <button type="button" onClick={() => void sendMessage('What are the fees?')}>Fee details</button>
              <button type="button" onClick={() => void sendMessage('What are the class timings?')}>Class timings</button>
              <button type="button" onClick={() => void sendMessage('What subjects are in Class 6?')}>Course details</button>
            </div>
          ) : null}
          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(draft);
            }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about school information"
              aria-label="Your question"
              maxLength={500}
              disabled={isSending}
            />
            <button type="submit" disabled={!draft.trim() || isSending}>Send</button>
          </form>
          <p className="chat-footnote">Answers use school-approved information only.</p>
        </section>
      ) : null}
      <button
        className="chat-launcher"
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close school assistant' : 'Open school assistant'}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="chat-launcher-icon" aria-hidden="true">{isOpen ? '×' : '?'}</span>
        <span>{isOpen ? 'Close' : 'Ask us'}</span>
      </button>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-badge">GS</div>
          <div>
            <h1>Gyanoday School</h1>
            <p>Grades 6 to 10</p>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="content-wrap">{children}</main>

      <footer className="site-footer">
        <div>
          <strong>Gyanoday School</strong>
          <p>Placeholder campus address, city, state, contact details.</p>
        </div>
        <div>
          <p>Phone: +91 00000 00000</p>
          <p>Email: admissions@gyanodayschool.example</p>
        </div>
      </footer>
      <SchoolChatWidget />
    </div>
  );
}

function HomePage() {
  return (
    <div className="page-section">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Welcome to our school community</span>
          <h2>Building confident learners from classes 6 to 10.</h2>
          <p>
            Gyanoday School is a nurturing learning environment that blends academic excellence, values education, and
            extracurricular growth to help every student thrive.
          </p>
          <div className="cta-row">
            <Link to="/admission" className="primary-btn">
              Apply for Admission
            </Link>
            <Link to="/teachers" className="secondary-btn">
              Meet Our Teachers
            </Link>
          </div>
          <div className="hero-stats" aria-label="School highlights">
            <div className="hero-stat">
              <strong>7+</strong>
              <span>Core subjects</span>
            </div>
            <div className="hero-stat">
              <strong>6-10</strong>
              <span>Grades served</span>
            </div>
            <div className="hero-stat">
              <strong>Holistic</strong>
              <span>Learning approach</span>
            </div>
          </div>
        </div>
        <figure className="hero-visual">
          <div className="hero-image-frame">
            <img
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=85"
              alt="Students learning together in a bright classroom"
            />
          </div>
          <figcaption className="hero-caption">
            <span className="caption-kicker">A place to grow</span>
            <span>Curiosity, confidence, and community.</span>
          </figcaption>
        </figure>
      </section>

      <section className="info-grid">
        <div className="info-card">
          <h3>Our Vision</h3>
          <p>To create purposeful learners who are academically strong, socially aware, and ready for life beyond school.</p>
        </div>
        <div className="info-card">
          <h3>Our Mission</h3>
          <p>To combine rigorous academic guidance with compassionate mentorship, discipline, and creative confidence.</p>
        </div>
        <div className="info-card">
          <h3>Quick Links</h3>
          <ul className="link-list">
            <li><Link to="/courses">View courses</Link></li>
            <li><Link to="/inquiries">Submit a student inquiry</Link></li>
            <li><Link to="/teachers">Meet teachers</Link></li>
            <li><Link to="/admission">Apply for admission</Link></li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function CoursesPage() {
  return (
    <div className="page-section">
      <div className="section-heading">
        <span className="eyebrow">Academic offerings</span>
        <h2>Subjects and programs for classes 6 to 10</h2>
      </div>

      <div className="course-grid">
        {courseData.map((group) => (
          <article key={group.className} className="course-card">
            <h3>{group.className}</h3>
            <p>{group.description}</p>
            <ul>
              {group.subjects.map((subject) => (
                <li key={subject}>{subject}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

function InquiryPage() {
  const [form, setForm] = useState({
    name: '',
    contact_details: '',
    role: 'parent',
    grade: '6',
    message: '',
  });
  const [status, setStatus] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await submitInquiry(form);
      setStatus('Your inquiry has been submitted successfully.');
      setForm({ name: '', contact_details: '', role: 'parent', grade: '6', message: '' });
    } catch (error) {
      setStatus('There was a problem submitting your inquiry. Please try again.');
    }
  };

  return (
    <div className="page-section narrow">
      <div className="section-heading">
        <span className="eyebrow">Connect with us</span>
        <h2>Student inquiries</h2>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>
            Full name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Contact details
            <input name="contact_details" value={form.contact_details} onChange={handleChange} placeholder="Phone number or email" required />
          </label>
          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="parent">Parent</option>
              <option value="student">Student</option>
            </select>
          </label>
          <label>
            Grade
            <select name="grade" value={form.grade} onChange={handleChange}>
              {[6, 7, 8, 9, 10].map((grade) => (
                <option key={grade} value={String(grade)}>
                  Class {grade}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Message
          <textarea name="message" value={form.message} onChange={handleChange} rows={6} required />
        </label>
        <button type="submit" className="primary-btn">Submit inquiry</button>
        {status ? <p className="status-note">{status}</p> : null}
      </form>
    </div>
  );
}

function AdmissionPage() {
  const [form, setForm] = useState({
    applicant_name: '',
    contact_details: '',
    child_name: '',
    grade: '6',
    message: '',
  });
  const [status, setStatus] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await submitAdmission(form);
      setStatus('Your admission inquiry has been received. We will contact you shortly.');
      setForm({ applicant_name: '', contact_details: '', child_name: '', grade: '6', message: '' });
    } catch (error) {
      setStatus('The admission form could not be submitted. Please try again.');
    }
  };

  return (
    <div className="page-section narrow">
      <div className="section-heading">
        <span className="eyebrow">Admission</span>
        <h2>Join Gyanoday School</h2>
      </div>

      <div className="admission-summary">
        <p>
          Placeholder admissions process: complete the admission inquiry below, and our admissions team will share the next steps,
          fee details, and campus tour information.
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>
            Parent or guardian name
            <input name="applicant_name" value={form.applicant_name} onChange={handleChange} required />
          </label>
          <label>
            Contact details
            <input name="contact_details" value={form.contact_details} onChange={handleChange} placeholder="Phone or email" required />
          </label>
          <label>
            Student name
            <input name="child_name" value={form.child_name} onChange={handleChange} required />
          </label>
          <label>
            Desired grade
            <select name="grade" value={form.grade} onChange={handleChange}>
              {[6, 7, 8, 9, 10].map((grade) => (
                <option key={grade} value={String(grade)}>
                  Class {grade}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Additional notes
          <textarea name="message" value={form.message} onChange={handleChange} rows={6} required />
        </label>
        <button type="submit" className="primary-btn">Submit admission form</button>
        {status ? <p className="status-note">{status}</p> : null}
      </form>
    </div>
  );
}

function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers()
      .then((response) => setTeachers(response.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-section">
      <div className="section-heading">
        <span className="eyebrow">Faculty</span>
        <h2>Our teachers</h2>
      </div>

      {loading ? (
        <p>Loading teacher profiles...</p>
      ) : (
        <div className="teacher-grid">
          {teachers.map((teacher, index) => (
            <article key={teacher.id} className="teacher-card">
              <div className="teacher-header">
                <div className="teacher-photo">
                  <span aria-hidden="true">{teacher.name.charAt(0)}</span>
                  <img
                    src={teacherPlaceholderImages[index % teacherPlaceholderImages.length]}
                    alt={`Placeholder portrait for ${teacher.name}`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                </div>
                <div>
                  <h3>{teacher.name}</h3>
                  <span>{teacher.subject}</span>
                </div>
              </div>
              <p className="teacher-meta">{teacher.qualifications}</p>
              <p className="teacher-meta">Experience: {teacher.years_of_experience} years</p>
              <p>{teacher.bio}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean>(Boolean(localStorage.getItem('admin_token')));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'inquiries' | 'admissions'>('inquiries');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [inquiryResponse, admissionResponse] = await Promise.all([listInquiriesAdmin(), listAdmissionsAdmin()]);
      setInquiries(inquiryResponse.data);
      setAdmissions(admissionResponse.data);
    } catch (error) {
      setError('Your session has expired. Please log in again.');
      logoutAdmin();
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadAdminData();
    }
  }, [authenticated]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await loginAdmin(username, password);
      setAuthenticated(true);
      setError('');
      navigate('/admin');
    } catch (error) {
      setError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setAuthenticated(false);
    navigate('/admin');
  };

  const handleStatusChange = async (type: 'inquiries' | 'admissions', id: number, status: string) => {
    try {
      if (type === 'inquiries') {
        await updateInquiryStatus(id, status);
      } else {
        await updateAdmissionStatus(id, status);
      }
      await loadAdminData();
    } catch (error) {
      setError('Failed to update status.');
    }
  };

  if (!authenticated) {
    return (
      <div className="page-section narrow">
        <div className="section-heading">
          <span className="eyebrow">Admin access</span>
          <h2>Secure administrator login</h2>
        </div>

        <form className="form-card" onSubmit={handleLogin}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit" className="primary-btn">Login</button>
          {error ? <p className="status-note">{error}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Protected dashboard</span>
          <h2>School administration</h2>
        </div>
        <button className="secondary-btn" onClick={handleLogout} type="button">
          Logout
        </button>
      </div>

      <div className="tab-row">
        <button className={view === 'inquiries' ? 'tab active' : 'tab'} onClick={() => setView('inquiries')} type="button">
          Inquiries
        </button>
        <button className={view === 'admissions' ? 'tab active' : 'tab'} onClick={() => setView('admissions')} type="button">
          Admissions
        </button>
      </div>

      {loading ? (
        <p>Loading records...</p>
      ) : (
        <div className="table-wrap">
          {view === 'inquiries' ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Grade</th>
                  <th>Contact</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.role}</td>
                    <td>{item.grade}</td>
                    <td>{item.contact_details}</td>
                    <td>{item.message}</td>
                    <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                    <td>
                      <select value={item.status} onChange={(e) => handleStatusChange('inquiries', item.id, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="read">Read</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Student</th>
                  <th>Grade</th>
                  <th>Contact</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.applicant_name}</td>
                    <td>{item.child_name}</td>
                    <td>{item.grade}</td>
                    <td>{item.contact_details}</td>
                    <td>{item.message}</td>
                    <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                    <td>
                      <select value={item.status} onChange={(e) => handleStatusChange('admissions', item.id, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="read">Read</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/inquiries" element={<InquiryPage />} />
        <Route path="/admission" element={<AdmissionPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
