import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";

// --- GLOBAL CONFIG & API HELPER ---
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const MEDIA_BASE = "http://localhost:8000"; // Base for Django media files

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("access");
    const headers = new Headers(options.headers || {});
    // Don't set Content-Type for FormData, browser does it automatically with boundary
    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        let errorMessage = "An error occurred.";
        try {
            const errorData = data.detail ? JSON.parse(data.detail) : data;
            const firstErrorKey = Object.keys(errorData)[0];
            errorMessage = `${firstErrorKey}: ${errorData[firstErrorKey][0]}`;
        } catch (e) {
            errorMessage = data.detail || JSON.stringify(data);
        }
        throw new Error(errorMessage);
    }
    return data;
}

// --- SVG ICONS ---
const Icons = {
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
};


// --- STATIC DATA FOR PLAYER DASHBOARD ---
const sportOpportunities = {
    table_tennis: {
        tournaments: [
            { name: "Visakhapatnam District Open", date: "Nov 15, 2025", location: "Swarna Bharathi Indoor Stadium" },
            { name: "State Ranking Championship", date: "Dec 5, 2025", location: "Vijayawada" },
        ],
        scholarships: [
            { name: "SAAP Talent Hunt Scholarship", description: "For promising state-level players under 18.", link: "#" },
            { name: "Petroleum Sports Promotion Board (PSPB)", description: "For national-level players.", link: "#" },
        ]
    },
    football: {
        tournaments: [
            { name: "City League Division A", date: "Nov 22, 2025", location: "Port Stadium" },
            { name: "Andhra Premier League U-19 Trials", date: "Dec 10, 2025", location: "Guntur" },
        ],
        scholarships: [
            { name: "Reliance Foundation Youth Champs", description: "Nationwide scouting program for young talent.", link: "#" },
        ]
    },
    cricket: {
        tournaments: [
            { name: "VDCA League Selections", date: "Nov 1, 2025", location: "ACA-VDCA Cricket Stadium" },
        ],
        scholarships: [
            { name: "Andhra Cricket Association (ACA) Stipend", description: "For players in state-level camps.", link: "#" },
        ]
    },
};


// --- CORE UI COMPONENTS ---

function Navbar() {
    const navigate = useNavigate();
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const photoUrl = localStorage.getItem("photoUrl");

    function logout() {
        localStorage.clear();
        navigate("/");
        window.location.reload();
    }

    return (
        <div className="navbar bg-base-100 shadow-lg sticky top-0 z-30">
            <div className="flex-1">
                <Link to="/" className="btn btn-ghost text-xl normal-case">S3 Sports Arena</Link>
            </div>
            <div className="flex-none gap-2">
                {username ? (
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                <img alt="User Avatar" src={photoUrl && photoUrl !== 'null' ? `${MEDIA_BASE}${photoUrl}`: `https://ui-avatars.com/api/?name=${username}&background=0D8ABC&color=fff`} />
                            </div>
                        </div>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-300 rounded-box w-52">
                            <li className="p-2 font-bold">{username} <span className="badge badge-ghost capitalize">{role}</span></li>
                            <li><Link to="/profile">My Profile</Link></li>
                            <li className="mt-2"><button className="btn btn-error btn-sm" onClick={logout}>Logout</button></li>
                        </ul>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
                        <Link to="/register" className="btn btn-accent btn-sm">Register</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function Home() {
    return (
        <div className="hero min-h-screen" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2970&auto=format&fit=crop)' }}>
            <div className="hero-overlay bg-black bg-opacity-60"></div>
            <div className="hero-content text-center text-neutral-content">
                <div className="max-w-md">
                    <h1 className="mb-5 text-5xl font-bold">Your Academy, Digitalized</h1>
                    <p className="mb-5">The ultimate platform for connecting players, coaches, parents, and management. Transparency and progress, tracked.</p>
                    <div className="flex justify-center gap-4">
                         <Link to="/login" className="btn btn-primary">Login</Link>
                         <Link to="/register" className="btn btn-outline btn-accent">Register</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- AUTHENTICATION COMPONENTS ---

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [quoteIndex, setQuoteIndex] = useState(0);

    const quotes = [
        "The only way to prove that you’re a good sport is to lose.",
        "Hard work beats talent when talent doesn’t work hard.",
        "It’s not whether you get knocked down; it’s whether you get up.",
        "The more difficult the victory, the greater the happiness in winning."
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [quoteIndex, quotes.length]);


    async function submit(e) {
        e.preventDefault();
        try {
            const data = await apiFetch(`/auth/token/`, { method: "POST", body: JSON.stringify({ username, password }) });
            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh);
            
            const users = await apiFetch(`/users/`);
            const me = users.find(u => u.username === username);

            if (me) {
                localStorage.setItem("username", me.username);
                localStorage.setItem("role", me.role);
                localStorage.setItem("userId", me.id);
                localStorage.setItem("photoUrl", me.photo);
                navigate(getDashboardPath(me.role));
                window.location.reload();
            } else {
                 throw new Error("Could not find user details after login.");
            }
        } catch (err) {
            setError(err.message.replace(/"/g, '') || "Authentication failed. Please check credentials.");
        }
    }

    function getDashboardPath(r) {
        if (r === "coach") return "/coach";
        if (r === "player") return "/player";
        if (r === "parent") return "/parent";
        return "/admin";
    }

    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="card glass shrink-0 w-full max-w-sm shadow-2xl">
                <form onSubmit={submit} className="card-body">
                    <h2 className="card-title text-2xl justify-center">Login</h2>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Username</span></label>
                        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="input input-bordered" required />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Password</span></label>
                        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className="input input-bordered" required />
                    </div>
                    {error && <div role="alert" className="alert alert-error text-sm p-2"><span>{error}</span></div>}
                    <div className="form-control mt-6">
                        <button className="btn btn-primary">Login</button>
                    </div>
                    <div className="text-center mt-4">
                        <Link to="/register" className="link">Don't have an account? Register</Link>
                    </div>
                    <div className="divider"></div>
                    <div className="text-center text-sm opacity-70 italic h-10">
                        "{quotes[quoteIndex]}"
                    </div>
                </form>
            </div>
        </div>
    );
}


function Register() {
    const [view, setView] = useState('player'); // player or parent

    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="card glass shrink-0 w-full max-w-md shadow-2xl">
                <div className="card-body">
                    <div role="tablist" className="tabs tabs-boxed">
                        <button role="tab" className={`tab ${view === 'player' ? 'tab-active' : ''}`} onClick={() => setView('player')}>Player / Coach</button>
                        <button role="tab" className={`tab ${view === 'parent' ? 'tab-active' : ''}`} onClick={() => setView('parent')}>Parent</button>
                    </div>
                    {view === 'player' ? <PlayerCoachRegisterForm /> : <ParentRegisterForm />}
                </div>
            </div>
        </div>
    );
}

function PlayerCoachRegisterForm() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("player");
    const [sport, setSport] = useState("table_tennis");
    const [err, setErr] = useState("");

    async function submit(e) {
        e.preventDefault();
        const payload = { username, email, password, role, profile: { sport: sport || null } };
        try {
            await apiFetch(`/auth/register/`, { method: "POST", body: JSON.stringify(payload) });
            alert("Registered successfully. Please login.");
            navigate('/login');
        } catch (err) {
            setErr(err.message.replace(/"/g, ''));
        }
    }

    return (
        <form onSubmit={submit} className="space-y-3 pt-4">
            <h2 className="font-bold text-lg">Register as Player or Coach</h2>
            <div className="form-control">
                <label className="label"><span className="label-text">Username</span></label>
                <input value={username} onChange={e => setUsername(e.target.value)} className="input input-bordered" required />
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text">Email</span></label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input input-bordered" required />
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text">Password</span></label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="input input-bordered" required />
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text">I am a...</span></label>
                <select value={role} onChange={e => setRole(e.target.value)} className="select select-bordered">
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                </select>
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text">Primary Sport</span></label>
                <select value={sport} onChange={e => setSport(e.target.value)} className="select select-bordered" required>
                    <option value="table_tennis">Table Tennis</option>
                    <option value="football">Football</option>
                    <option value="athletics">Athletics</option>
                    <option value="cricket">Cricket</option>
                    <option value="badminton">Badminton</option>
                </select>
            </div>
            {err && <div role="alert" className="alert alert-error text-sm p-2"><span>{err}</span></div>}
            <div className="form-control mt-6">
                <button className="btn btn-primary">Register</button>
            </div>
        </form>
    );
}

function ParentRegisterForm() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [childPlayerId, setChildPlayerId] = useState("");
    const [err, setErr] = useState("");

    async function submit(e) {
        e.preventDefault();
        const payload = { username, email, password, child_player_id: childPlayerId };
        try {
            await apiFetch(`/auth/register/parent/`, { method: "POST", body: JSON.stringify(payload) });
            alert("Parent account registered successfully. Please login.");
            navigate('/login');
        } catch (err) {
            setErr(err.message.replace(/"/g, ''));
        }
    }
    
    return (
        <form onSubmit={submit} className="space-y-3 pt-4">
            <h2 className="font-bold text-lg">Register as Parent</h2>
            <p className="text-sm opacity-70">You'll need your child's unique Player ID provided by the academy.</p>
            <div className="form-control">
                <label className="label"><span className="label-text">Your Username</span></label>
                <input value={username} onChange={e => setUsername(e.target.value)} className="input input-bordered" required />
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text">Your Email</span></label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input input-bordered" required />
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text">Your Password</span></label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="input input-bordered" required />
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text">Your Child's Player ID</span></label>
                <input value={childPlayerId} onChange={e => setChildPlayerId(e.target.value)} placeholder="e.g., S3-0001" className="input input-bordered" required />
            </div>
            {err && <div role="alert" className="alert alert-error text-sm p-2"><span>{err}</span></div>}
            <div className="form-control mt-6">
                <button className="btn btn-primary">Register Parent Account</button>
            </div>
        </form>
    );
}

// --- NEW PROFILE PAGE ---
function ProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        (async () => {
            try {
                const userData = await apiFetch(`/users/${userId}/`);
                setUser(userData);
            } catch (err) {
                setError("Failed to load user profile.");
            } finally {
                setLoading(false);
            }
        })();
    }, [userId]);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append('photo', selectedFile);

            const updatedUser = await apiFetch(`/users/${userId}/`, {
                method: 'PATCH',
                body: formData,
            });
            setUser(updatedUser);
            localStorage.setItem("photoUrl", updatedUser.photo);
            setSelectedFile(null);
            fileInputRef.current.value = null; // Clear file input
        } catch (err) {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-6 text-center"><span className="loading loading-lg"></span></div>;
    if (!user) return <div className="p-6 text-center">User not found.</div>;

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">My Profile</h1>
            {error && <div role="alert" className="alert alert-error mb-4"><span>{error}</span></div>}
            <div className="card glass shadow-xl">
                <div className="card-body items-center text-center">
                    <div className="avatar">
                        <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                             <img alt="User Avatar" src={user.photo ? `${MEDIA_BASE}${user.photo}`: `https://ui-avatars.com/api/?name=${user.username}&background=0D8ABC&color=fff&size=128`} />
                        </div>
                    </div>
                    <h2 className="card-title text-3xl mt-4">{user.username}</h2>
                    <p>{user.email}</p>
                    <span className="badge badge-lg badge-accent capitalize mt-2">{user.role}</span>

                    <div className="divider my-6">Details</div>
                    
                    <div className="text-left w-full space-y-2">
                        {user.player_id && <p><strong>Player ID:</strong> <span className="font-mono p-1 bg-base-300 rounded">{user.player_id}</span></p>}
                        {user.profile?.sport && <p className="capitalize"><strong>Sport:</strong> {user.profile.sport.replace("_", " ")}</p>}
                        {user.membership_start_date && <p><strong>Membership Active From:</strong> {new Date(user.membership_start_date).toLocaleDateString()}</p>}
                        {user.membership_end_date && <p><strong>Membership Active Until:</strong> {new Date(user.membership_end_date).toLocaleDateString()}</p>}
                    </div>

                    <div className="divider my-6">Update Photo</div>

                    <div className="form-control w-full max-w-xs">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="file-input file-input-bordered w-full" accept="image/*" />
                        {selectedFile && 
                            <button onClick={handleUpload} className={`btn btn-primary mt-4 ${uploading ? 'btn-disabled' : ''}`}>
                                {uploading ? <span className="loading loading-spinner"></span> : 'Upload New Photo'}
                            </button>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- ROLE-SPECIFIC DASHBOARDS ---

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [sportFilter, setSportFilter] = useState("");
    const [viewingUser, setViewingUser] = useState(null);
    const [userTasks, setUserTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const SPORT_CHOICES = ["", "table_tennis", "football", "athletics", "cricket", "badminton"];

    useEffect(() => {
        (async () => {
            setLoading(true);
            let url = '/users/';
            if (sportFilter) url += `?sport=${sportFilter}`;
            const userData = await apiFetch(url);
            setUsers(userData);
            setLoading(false);
        })();
    }, [sportFilter]);

    const handleViewTasks = async (user) => {
        setViewingUser(user);
        try {
            const allTasks = await apiFetch('/tasks/');
            const assignedTasks = allTasks.filter(task => task.players.some(p => p.id === user.id));
            setUserTasks(assignedTasks);
            document.getElementById('tasks_modal').showModal();
        } catch (error) { console.error("Failed to fetch tasks for user", error); }
    };
    
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Management Dashboard</h1>
            <div className="form-control mb-6 max-w-xs">
                <label className="label"><span className="label-text">Filter by Sport</span></label>
                <select value={sportFilter} onChange={e => setSportFilter(e.target.value)} className="select select-bordered select-primary">
                    {SPORT_CHOICES.map(sport => 
                        <option key={sport} value={sport}>{sport ? sport.replace("_", " ").toUpperCase() : 'All Sports'}</option>
                    )}
                </select>
            </div>

            {loading ? <div className="text-center p-10"><span className="loading loading-lg"></span></div> :
            <div className="overflow-x-auto bg-base-100 rounded-lg shadow-xl">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Player ID</th>
                            <th>Membership End Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="hover">
                                <td>{user.username}</td>
                                <td><span className="badge badge-ghost capitalize">{user.role}</span></td>
                                <td>{user.player_id || 'N/A'}</td>
                                <td>{user.membership_end_date ? new Date(user.membership_end_date).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    {user.role === 'player' && (
                                        <button className="btn btn-xs btn-outline" onClick={() => handleViewTasks(user)}>View Tasks</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>}

            <dialog id="tasks_modal" className="modal">
                <div className="modal-box w-11/12 max-w-2xl glass">
                    <h3 className="font-bold text-lg">Tasks for {viewingUser?.username}</h3>
                    <div className="py-4 space-y-3 max-h-96 overflow-auto">
                        {userTasks.length > 0 ? userTasks.map(task => (
                            <div key={task.id} className="p-4 border rounded-lg bg-base-200">
                                <p className="font-semibold">{task.title}</p>
                                <p className="text-sm opacity-80">{task.description}</p>
                            </div>
                        )) : <p>No tasks assigned to this player.</p>}
                    </div>
                    <div className="modal-action">
                        <form method="dialog"><button className="btn">Close</button></form>
                    </div>
                </div>
            </dialog>
        </div>
    );
}

function ParentDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch('/parent/dashboard/');
                setDashboardData(data);
            } catch (err) { setError("Could not load dashboard. Ensure you are logged in as a parent and linked to a child."); } 
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <div className="p-6 text-center"><span className="loading loading-lg"></span></div>;
    if (error) return <div role="alert" className="alert alert-error m-6"><span>{error}</span></div>;
    if (!dashboardData) return <div className="p-6 text-center">No data found.</div>;

    const { child, tasks } = dashboardData;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Parent Dashboard</h1>
            <div className="card glass shadow-xl mb-6">
                <div className="card-body">
                    <h2 className="card-title">Tracking Progress for: {child.username}</h2>
                    <p><strong>Player ID:</strong> <span className="font-mono">{child.player_id}</span></p>
                    <p className="capitalize"><strong>Sport:</strong> {child.profile.sport.replace("_", " ")}</p>
                </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">Assigned Tasks ({tasks.length})</h3>
            <div className="space-y-4">
                {tasks.map(t => <TaskCard key={t.id} task={t} isParentView={true} childId={child.id} />)}
                {tasks.length === 0 && <p>Your child has no tasks assigned yet.</p>}
            </div>
        </div>
    );
}

function CoachDashboard() {
    const [tasks, setTasks] = useState([]);
    const [players, setPlayers] = useState([]);
    const [myProfile, setMyProfile] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [dueDate, setDueDate] = useState("");
    const [timeLimit, setTimeLimit] = useState("");

    const fetchTasks = async () => {
        try {
            const allTasks = await apiFetch('/tasks/');
            const username = localStorage.getItem('username');
            const myTasks = allTasks.filter(t => t.assigned_by.username === username);
            setTasks(myTasks);
        } catch (err) {
            setError("Failed to fetch tasks.");
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const username = localStorage.getItem('username');
                const users = await apiFetch('/users/');
                const me = users.find(u => u.username === username);
                setMyProfile(me);
                
                const profs = await apiFetch('/profiles/');
                const playersList = profs.filter(p => p.user.role === 'player' && p.sport === me.profile.sport);
                setPlayers(playersList);

                await fetchTasks();
            } catch (err) {
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const createAndAssign = async (e) => {
        e.preventDefault();
        setError("");
        if (selectedPlayers.length === 0) {
            setError("Please select at least one player.");
            document.getElementById('task_modal').showModal();
            return;
        }
        try {
            const payload = { 
                title, 
                description: desc, 
                players: selectedPlayers,
                due_date: dueDate || null,
                time_limit_minutes: timeLimit || null
            };
            await apiFetch('/tasks/', { method: 'POST', body: JSON.stringify(payload) });
            document.getElementById('task_modal').close();
            setTitle(''); setDesc(''); setSelectedPlayers([]); setDueDate(''); setTimeLimit('');
            await fetchTasks();
        } catch (err) {
            setError(err.message.replace(/"/g, '') || "Failed to create task.");
            document.getElementById('task_modal').showModal();
        }
    };

    const handleMarkComplete = async (taskId, playerId) => {
        setError("");
        try {
            await apiFetch(`/coach/tasks/${taskId}/player/${playerId}/complete/`, { method: 'POST' });
            await fetchTasks();
        } catch (err) {
            setError("Failed to mark task as complete.");
        }
    };

    const togglePlayerSelection = (id) => {
        setSelectedPlayers(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    if (loading || !myProfile) return <div className="p-6 text-center"><span className="loading loading-lg"></span></div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Coach Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="card glass shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title capitalize">Players in {myProfile.profile.sport.replace("_", " ")} ({players.length})</h2>
                            <div className="mt-2 space-y-3 max-h-[60vh] overflow-auto">
                                {players.map(p => (
                                    <div key={p.user.id} className="p-2 border-b border-base-content/10">
                                        <p className="font-semibold">{p.user.username}</p>
                                        <p className="text-xs opacity-70">{p.user.email}</p>
                                    </div>
                                ))}
                                {players.length === 0 && <p className="text-sm opacity-70">No players found for your sport.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Your Created Tasks</h2>
                        <button className="btn btn-primary" onClick={()=>document.getElementById('task_modal').showModal()}>{Icons.plus} Create Task</button>
                    </div>
                    {error && <div role="alert" className="alert alert-error mb-4"><span>{error}</span></div>}

                    <div className="space-y-6">
                        {tasks.map(task => (
                            <div key={task.id} className="card bg-base-100 shadow-lg collapse collapse-arrow">
                                <input type="checkbox" className="peer" /> 
                                <div className="collapse-title text-xl font-medium peer-checked:bg-base-300">
                                    {task.title}
                                </div>
                                <div className="collapse-content peer-checked:bg-base-300"> 
                                    <p className="text-sm opacity-80 pt-4">{task.description}</p>
                                    <div className="divider my-2">Assigned Players</div>
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra table-sm">
                                            <thead><tr><th>Player</th><th>Status</th><th>Action</th></tr></thead>
                                            <tbody>
                                                {task.players.map(player => {
                                                    const completion = task.completions.find(c => c.player === player.id);
                                                    const isCompleted = completion?.completed;
                                                    return (
                                                        <tr key={player.id}>
                                                            <td>{player.username}</td>
                                                            <td><span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>{isCompleted ? 'Completed' : 'Pending'}</span></td>
                                                            <td>
                                                                <button onClick={() => handleMarkComplete(task.id, player.id)} className="btn btn-xs btn-outline btn-success" disabled={isCompleted}>Mark Done</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && <div className="card bg-base-100 shadow-md"><div className="card-body"><p>You have not created any tasks yet.</p></div></div>}
                    </div>
                </div>
            </div>

            <dialog id="task_modal" className="modal">
                <div className="modal-box glass">
                    <h3 className="font-bold text-lg mb-4">Create & Assign Task</h3>
                    <form onSubmit={createAndAssign} className="space-y-4">
                        <div className="form-control"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="input input-bordered w-full" required /></div>
                        <div className="form-control"><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="textarea textarea-bordered w-full" rows="3" required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">Due Date (Optional)</span></label>
                                <input value={dueDate} onChange={e => setDueDate(e.target.value)} type="date" className="input input-bordered w-full" />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Time Limit (Mins)</span></label>
                                <input value={timeLimit} onChange={e => setTimeLimit(e.target.value)} type="number" placeholder="e.g., 30" className="input input-bordered w-full" />
                            </div>
                        </div>
                        <div className="divider">Select Players</div>
                        <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-base-200 rounded-md">
                            {players.map(p => (
                                <div key={p.user.id} className="form-control">
                                    <label className="label cursor-pointer"><span className="label-text">{p.user.username}</span><input type="checkbox" checked={selectedPlayers.includes(p.user.id)} onChange={() => togglePlayerSelection(p.user.id)} className="checkbox checkbox-primary" /></label>
                                </div>
                            ))}
                        </div>
                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => {document.getElementById('task_modal').close(); setError("")}}>Close</button>
                            <button type="submit" className="btn btn-primary">Create & Assign</button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}

function PlayerDashboard() {
    const [tasks, setTasks] = useState([]);
    const [coach, setCoach] = useState(null);
    const [myProfile, setMyProfile] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const opportunities = myProfile?.profile?.sport ? (sportOpportunities[myProfile.profile.sport] || { tournaments: [], scholarships: [] }) : { tournaments: [], scholarships: [] };

    const fetchTasks = async () => {
        try {
            const taskData = await apiFetch('/player/my-tasks/');
            setTasks(taskData);
        } catch (err) {
            setError("Failed to fetch tasks.");
        }
    };

     useEffect(() => {
        (async () => {
            try {
                const username = localStorage.getItem('username');
                const users = await apiFetch('/users/');
                const myProf = users.find(u => u.username === username);
                setMyProfile(myProf);

                if (myProf?.profile?.sport) {
                    const foundCoach = users.find(u => u.role === 'coach' && u.profile.sport === myProf.profile.sport);
                    setCoach(foundCoach);
                }
                await fetchTasks();
            } catch (err) {
                setError("Failed to load player data.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleStartTask = async (taskId) => {
        setError("");
        try {
            await apiFetch(`/player/tasks/${taskId}/start/`, { method: 'POST' });
            await fetchTasks();
        } catch (err) {
            setError("Failed to start task.");
        }
    };

    if (loading) return <div className="p-6 text-center"><span className="loading loading-lg"></span></div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Player Dashboard</h1>
            {error && <div role="alert" className="alert alert-error mb-4"><span>{error}</span></div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {myProfile && (
                     <div className="card glass shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-lg">Your Player ID</h2>
                            <p className="text-2xl font-mono bg-base-300 text-center p-2 rounded-lg">{myProfile.player_id}</p>
                            <p className="text-xs text-center mt-1 opacity-70">Share this with your parent to track your progress.</p>
                        </div>
                    </div>
                )}
                {coach && (
                    <div className="card glass shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-lg">Your Coach</h2>
                            <p className="capitalize text-xl">{coach.username} ({coach.profile.sport.replace("_", " ")})</p>
                        </div>
                    </div>
                )}
            </div>

            <h2 className="text-2xl font-semibold mb-4">Assigned Tasks ({tasks.length})</h2>
            <div className="space-y-4">
                {tasks.map(t => <TaskCard key={t.id} task={t} onStartTask={handleStartTask} />)}
                {tasks.length === 0 && <div className="card bg-base-100 shadow-md"><div className="card-body"><p>You have no tasks assigned yet. Great job!</p></div></div>}
            </div>
            
            <div className="divider my-8">Opportunities</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-2xl font-semibold mb-4">Upcoming Tournaments</h3>
                    <div className="space-y-4">
                        {opportunities.tournaments.map((tourney, index) => (
                            <div key={index} className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h4 className="card-title">{tourney.name}</h4>
                                    <p>{tourney.date} - {tourney.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h3 className="text-2xl font-semibold mb-4">Scholarships</h3>
                    <div className="space-y-4">
                        {opportunities.scholarships.map((scholarship, index) => (
                            <div key={index} className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h4 className="card-title">{scholarship.name}</h4>
                                    <p>{scholarship.description}</p>
                                    <div className="card-actions justify-end">
                                        <a href={scholarship.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Learn More</a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- HELPER HOOKS & SHARED COMPONENTS ---
function useCountdown(task, completion) {
    const [remaining, setRemaining] = useState(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!task.time_limit_minutes || !completion?.started_at || completion?.completed) {
            if (remaining !== null) setRemaining(null);
            if(intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        const calculateRemaining = () => {
            const startTime = new Date(completion.started_at).getTime();
            const endTime = startTime + task.time_limit_minutes * 60 * 1000;
            const now = new Date().getTime();
            const timeLeft = Math.round((endTime - now) / 1000);

            if (timeLeft <= 0) {
                setRemaining(0);
                clearInterval(intervalRef.current);
            } else {
                setRemaining(timeLeft);
            }
        };
        calculateRemaining();
        intervalRef.current = setInterval(calculateRemaining, 1000);
        return () => clearInterval(intervalRef.current);
    }, [task.time_limit_minutes, completion?.started_at, completion?.completed, remaining]);

    if (remaining === null) return null;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function TaskCard({ task, onStartTask, isParentView = false, childId = null }) {
    const myId = isParentView ? childId : parseInt(localStorage.getItem('userId'));
    const completion = task.completions.find(c => c.player === myId);
    const isCompleted = completion?.completed;
    const timer = useCountdown(task, completion);

    return (
        <div className={`card bg-base-100 shadow-lg ${isCompleted ? 'border-success border-2' : ''}`}>
            <div className="card-body p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="card-title">{task.title}</h3>
                        <p className="text-sm opacity-80">{task.description}</p>
                        <div className="text-xs opacity-60 mt-2 space-x-4">
                            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                            {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                        <div className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>
                            {isCompleted ? 'Completed' : 'Pending'}
                        </div>
                        {task.time_limit_minutes && <div className="text-sm mt-1">{task.time_limit_minutes} min limit</div>}
                    </div>
                </div>
                <div className="card-actions justify-end items-center mt-4">
                    {timer && <span className="font-mono text-xl text-secondary">{timer}</span>}
                    {!isParentView && !completion?.started_at && task.time_limit_minutes && !isCompleted && (
                        <button onClick={() => onStartTask(task.id)} className="btn btn-primary btn-sm">Start Timer</button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- MAIN APP ROUTER ---
export default function App() {
    const role = localStorage.getItem("role");
    
    const ProtectedRoute = ({ children, allowedRoles }) => {
        const token = localStorage.getItem("access");
        if (!token || !allowedRoles.includes(role)) {
            return <Navigate to="/login" replace />;
        }
        return children;
    };
    
    return (
        <Router>
            <Navbar />
            <div className="bg-base-200 min-h-screen">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<ProtectedRoute allowedRoles={['management', 'coach', 'player', 'parent']}><ProfilePage /></ProtectedRoute>} />
                    <Route path="/coach" element={<ProtectedRoute allowedRoles={['coach']}><CoachDashboard /></ProtectedRoute>} />
                    <Route path="/player" element={<ProtectedRoute allowedRoles={['player']}><PlayerDashboard /></ProtectedRoute>} />
                    <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['management']}><AdminDashboard /></ProtectedRoute>} />
                </Routes>
            </div>
        </Router>
    );
}
