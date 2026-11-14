import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit3,
  History,
  ArrowLeft,
  Compass,
  Gift,
  PlusCircle,
  MinusCircle,
  LogOut,
  ChevronRight,
  KeyRound,
} from 'lucide-react';

// ============================================================================
// 1. IDE ÍRD BE A SAJÁT FIREBASE ADATAIDAT ÉS A SZÜLŐI PIN-KÓDOT!
// ============================================================================
const PARENT_PIN = "1980"; // Ezzel a kóddal tudtok belépni a szülői felületre

const firebaseConfig = {
  apiKey: "AIzaSyDeAQXRFRubulqtgwIHsmLW5SX5ofR_bi0",
  authDomain: "oceania-2a6ea.firebaseapp.com",
  projectId: "oceania-2a6ea",
  storageBucket: "oceania-2a6ea.firebasestorage.app",
  messagingSenderId: "921927011720",
  appId: "1:921927011720:web:60bdedf9b57eda7d27be3d"
};
// ============================================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_REF = doc(db, 'appData', 'familyBoard');

const SEA_CREATURES = [
  { id: 'turtle', name: 'Tengeri teknős', emoji: '🐢' },
  { id: 'dolphin', name: 'Delfin', emoji: '🐬' },
  { id: 'whale', name: 'Kék bálna', emoji: '🐋' },
  { id: 'octopus', name: 'Polip', emoji: '🐙' },
  { id: 'jellyfish', name: 'Holdmedúza', emoji: '🪼' },
  { id: 'fish', name: 'Bohóchal', emoji: '🐠' },
  { id: 'blowfish', name: 'Gömbhal', emoji: '🐡' },
  { id: 'shark', name: 'Cetcápa', emoji: '🦈' },
  { id: 'seal', name: 'Fóka', emoji: '🦭' },
  { id: 'crab', name: 'Rákocska', emoji: '🦀' },
  { id: 'lobster', name: 'Homár', emoji: '🦞' },
  { id: 'shrimp', name: 'Garnéla', emoji: '🦐' },
  { id: 'squid', name: 'Tintahal', emoji: '🦑' },
  { id: 'coral', name: 'Korall', emoji: '🪸' },
  { id: 'shell', name: 'Gyöngykagyló', emoji: '🐚' },
  { id: 'orca', name: 'Kardszárnyú delfin', emoji: '🐳' },
];

const INITIAL_DATA = {
  stickers: [
    { id: 's1', creatureId: 'turtle', reason: 'Kezdő ajándék matrica', date: '2026. 11. 12.' },
  ],
  jellyfishCount: 0,
  tasks: [
    { id: 't1', title: 'Matek gyakorlás (30 perc)', points: 2 },
    { id: 't2', title: 'Szobarendrakás', points: 1 },
    { id: 't3', title: 'Angol szavak megtanulása', points: 1 },
    { id: 't4', title: 'Segítség a konyhában', points: 1 },
  ],
  rewards: [
    { id: 'r1', title: 'Közös fagyizás vagy buboréktea', cost: 10 },
    { id: 'r2', title: 'Mozizás választott filmmel', cost: 25 },
    { id: 'r3', title: 'Új könyv vagy ruhadarab', cost: 45 },
  ],
  challenges: [
    {
      id: 'c1',
      goal: '5-ös félévi vagy év végi jegy angolból',
      reward: 'Utazás az Azori-szigetekre (bálnales!)',
      completed: false,
    },
  ],
  history: [],
};

const AngryJellyfishIcon = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    <path
      d="M12 30C12 17.8497 20.9543 8 32 8C43.0457 8 52 17.8497 52 30C52 34.5 48 36 44 35C40 34 36 36 32 36C28 36 24 34 20 35C16 36 12 34.5 12 30Z"
      fill="#F43F5E"
      stroke="#9F1239"
      strokeWidth="2.5"
    />
    <path d="M20 21L28 24" stroke="#FFF1F2" strokeWidth="3" strokeLinecap="round" />
    <path d="M44 21L36 24" stroke="#FFF1F2" strokeWidth="3" strokeLinecap="round" />
    <circle cx="24" cy="26" r="2.2" fill="#FFF1F2" />
    <circle cx="40" cy="26" r="2.2" fill="#FFF1F2" />
    <path d="M27 31Q32 28 37 31" stroke="#FFF1F2" strokeWidth="2.2" strokeLinecap="round" />
    <path
      d="M18 35C16 42 20 48 17 55M27 36C26 44 29 50 27 57M37 36C38 44 35 50 37 57M46 35C48 42 44 48 47 55"
      stroke="#FB7185"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </svg>
);

export default function App() {
  const [isParent, setIsParent] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('child'); // 'child' | 'parent'
  const [childPage, setChildPage] = useState('home'); // 'home' | 'album' | 'history'
  const [toast, setToast] = useState(null);

  // Szülői űrlapok állapotai
  const [customReason, setCustomReason] = useState('');
  const [customAmount, setCustomAmount] = useState(1);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(15);
  const [editingRewardId, setEditingRewardId] = useState(null);

  const [newChallengeGoal, setNewChallengeGoal] = useState('');
  const [newChallengeReward, setNewChallengeReward] = useState('');
  const [editingChallengeId, setEditingChallengeId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Firestore élő szinkronizáció
  useEffect(() => {
    const unsub = onSnapshot(DOC_REF, (snap) => {
      if (snap.exists()) {
        setData({ ...INITIAL_DATA, ...snap.data() });
      } else {
        setData(INITIAL_DATA);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (enteredPin === PARENT_PIN) {
      setIsParent(true);
      setViewMode('parent');
      setShowPinModal(false);
      setEnteredPin('');
      setPinError('');
      showToast('Sikeres szülői belépés!');
    } else {
      setPinError('Hibás PIN-kód!');
      setEnteredPin('');
    }
  };

  const handleLogout = () => {
    setIsParent(false);
    setViewMode('child');
    showToast('Kilépve a szülői módból.');
  };

  const saveToDb = async (updatedFields) => {
    try {
      await setDoc(DOC_REF, { ...data, ...updatedFields }, { merge: true });
    } catch (e) {
      showToast('Hiba a mentésnél!');
    }
  };

  const formatDate = () =>
    new Date().toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const awardStickers = async (count, reasonText, isCustom = false) => {
    const now = formatDate();
    const newStickers = [];
    for (let i = 0; i < count; i++) {
      const randomCreature = SEA_CREATURES[Math.floor(Math.random() * SEA_CREATURES.length)];
      newStickers.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        creatureId: randomCreature.id,
        reason: isCustom ? `Más miatt${reasonText ? `: ${reasonText}` : ''}` : reasonText,
        date: now,
      });
    }
    const historyEntry = {
      id: `h-${Date.now()}`,
      type: 'earn',
      amount: count,
      text: isCustom ? `Más miatt${reasonText ? ` (${reasonText})` : ''}` : reasonText,
      date: now,
      by: 'Szülő',
    };
    await saveToDb({
      stickers: [...data.stickers, ...newStickers],
      history: [historyEntry, ...data.history],
    });
    showToast(`+${count} tengeri matrica jóváírva!`);
  };

  const changeJellyfish = async (delta) => {
    if (delta < 0 && data.jellyfishCount <= 0) return;
    const nextCount = Math.max(0, data.jellyfishCount + delta);
    const historyEntry = {
      id: `h-${Date.now()}`,
      type: delta > 0 ? 'jelly_add' : 'jelly_remove',
      amount: 1,
      text: delta > 0 ? 'Mérges medúza kapott' : 'Mérges medúza levéve',
      date: formatDate(),
      by: 'Szülő',
    };
    await saveToDb({
      jellyfishCount: nextCount,
      history: [historyEntry, ...data.history],
    });
    showToast(delta > 0 ? 'Mérges medúza hozzáadva.' : 'Mérges medúza levéve.');
  };

  const redeemReward = async (reward) => {
    if (data.stickers.length < reward.cost) return;
    const remainingStickers = data.stickers.slice(reward.cost);
    const historyEntry = {
      id: `h-${Date.now()}`,
      type: 'redeem',
      amount: reward.cost,
      text: `Beváltva: ${reward.title}`,
      date: formatDate(),
      by: isParent ? 'Szülő' : 'Gyerek',
    };
    await saveToDb({
      stickers: remainingStickers,
      history: [historyEntry, ...data.history],
    });
    showToast(`Beváltva: ${reward.title}!`);
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    let updated;
    if (editingTaskId) {
      updated = data.tasks.map((t) =>
        t.id === editingTaskId ? { ...t, title: newTaskTitle.trim(), points: Number(newTaskPoints) } : t
      );
      setEditingTaskId(null);
    } else {
      updated = [...data.tasks, { id: `t-${Date.now()}`, title: newTaskTitle.trim(), points: Number(newTaskPoints) }];
    }
    setNewTaskTitle('');
    setNewTaskPoints(1);
    await saveToDb({ tasks: updated });
  };

  const saveReward = async (e) => {
    e.preventDefault();
    if (!newRewardTitle.trim()) return;
    let updated;
    if (editingRewardId) {
      updated = data.rewards.map((r) =>
        r.id === editingRewardId ? { ...r, title: newRewardTitle.trim(), cost: Number(newRewardCost) } : r
      );
      setEditingRewardId(null);
    } else {
      updated = [...data.rewards, { id: `r-${Date.now()}`, title: newRewardTitle.trim(), cost: Number(newRewardCost) }];
    }
    setNewRewardTitle('');
    setNewRewardCost(15);
    await saveToDb({ rewards: updated });
  };

  const saveChallenge = async (e) => {
    e.preventDefault();
    if (!newChallengeGoal.trim() || !newChallengeReward.trim()) return;
    let updated;
    if (editingChallengeId) {
      updated = data.challenges.map((c) =>
        c.id === editingChallengeId
          ? { ...c, goal: newChallengeGoal.trim(), reward: newChallengeReward.trim() }
          : c
      );
      setEditingChallengeId(null);
    } else {
      updated = [
        ...data.challenges,
        { id: `c-${Date.now()}`, goal: newChallengeGoal.trim(), reward: newChallengeReward.trim(), completed: false },
      ];
    }
    setNewChallengeGoal('');
    setNewChallengeReward('');
    await saveToDb({ challenges: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#061b29] flex items-center justify-center text-cyan-300">
        Betöltés...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#061b29] via-[#0a2c42] to-[#072133] text-slate-100 pb-16">
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-cyan-500 text-slate-950 font-semibold px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* PIN-kód modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-cyan-300 flex items-center gap-2">
                <KeyRound className="w-5 h-5" /> Szülői PIN-kód
              </h3>
              <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                maxLength="6"
                placeholder="Add meg a PIN-kódot"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-center text-2xl tracking-widest text-white"
              />
              {pinError && <p className="text-xs text-rose-400 text-center">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
              >
                Belépés
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Felső sáv */}
      <header className="sticky top-0 z-30 bg-[#061b29]/85 backdrop-blur-md border-b border-cyan-500/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            <span className="font-bold tracking-wide text-cyan-100">Óceán Gyűjtemény</span>
          </div>

          <div className="flex items-center gap-2">
            {isParent ? (
              <>
                <button
                  onClick={() => setViewMode(viewMode === 'child' ? 'parent' : 'child')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                >
                  {viewMode === 'child' ? 'Szülői nézet' : 'Gyerek nézet'}
                </button>
                <button
                  onClick={handleLogout}
                  title="Kilépés szülői módból"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 flex items-center gap-1 text-xs"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowPinModal(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Szülői belépés
              </button>
            )}
          </div>
        </div>
      </header>

      {/* GYEREK NÉZET */}
      {viewMode === 'child' && (
        <main className="max-w-2xl mx-auto px-4 pt-6">
          {childPage === 'home' && (
            <div className="space-y-6">
              <div className="flex items-stretch gap-3">
                <button
                  onClick={() => setChildPage('album')}
                  className="flex-1 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 hover:from-cyan-500/30 hover:to-teal-500/20 border border-cyan-400/30 rounded-2xl p-6 text-left transition group relative overflow-hidden"
                >
                  <div className="text-xs uppercase tracking-wider text-cyan-300 font-semibold flex items-center justify-between">
                    <span>Összegyűjtött matricák</span>
                    <span className="flex items-center gap-1 text-cyan-200 group-hover:translate-x-1 transition">
                      Album <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-5xl font-extrabold text-white">{data.stickers.length}</span>
                    <span className="text-sm text-cyan-200/80">db tengeri lény</span>
                  </div>
                  <p className="text-xs text-cyan-300/70 mt-2">Kattints ide a tengeri album megnyitásához!</p>
                </button>

                <div className="w-28 bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <AngryJellyfishIcon className="w-9 h-9 mb-1" />
                  <span className="text-2xl font-bold text-rose-300">{data.jellyfishCount}</span>
                  <span className="text-[11px] text-rose-200/70 leading-tight mt-0.5">Mérges medúza</span>
                </div>
              </div>

              <button
                onClick={() => setChildPage('history')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center gap-2 text-sm text-cyan-200 transition"
              >
                <History className="w-4 h-4 text-cyan-400" />
                Előzmények (Mikor, mire kaptam matricát?)
              </button>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <Gift className="w-4 h-4" /> Beváltható jutalmak
                </h2>
                <div className="space-y-2.5">
                  {[...data.rewards]
                    .sort((a, b) => a.cost - b.cost)
                    .map((reward) => {
                      const canRedeem = data.stickers.length >= reward.cost;
                      return (
                        <div
                          key={reward.id}
                          className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${
                            canRedeem
                              ? 'bg-teal-900/30 border-teal-400/50'
                              : 'bg-slate-900/40 border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-100">{reward.title}</div>
                            <div className="text-xs text-cyan-300/80 mt-0.5">
                              Szükséges: <span className="font-bold">{reward.cost} matrica</span>
                            </div>
                          </div>
                          <button
                            disabled={!canRedeem}
                            onClick={() => redeemReward(reward)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition ${
                              canRedeem
                                ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-md hover:brightness-110'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Beváltás
                          </button>
                        </div>
                      );
                    })}
                </div>
              </section>

              <section className="space-y-3 pt-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Nagy Kihívások
                </h2>
                <div className="space-y-2.5">
                  {data.challenges.map((ch) => (
                    <div
                      key={ch.id}
                      className={`p-4 rounded-xl border ${
                        ch.completed
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : 'bg-slate-900/50 border-amber-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs uppercase font-bold text-amber-300/90">Cél:</span>
                          <p className="font-semibold text-slate-100">{ch.goal}</p>
                        </div>
                        {ch.completed && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                            Teljesítve!
                          </span>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800 text-sm text-cyan-200">
                        <span className="text-xs text-slate-400">Jutalom: </span>
                        {ch.reward}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {childPage === 'album' && (
            <div className="space-y-4">
              <button
                onClick={() => setChildPage('home')}
                className="flex items-center gap-1.5 text-sm text-cyan-300 hover:text-cyan-100"
              >
                <ArrowLeft className="w-4 h-4" /> Vissza a főoldalra
              </button>

              <div className="rounded-3xl overflow-hidden border border-cyan-400/30 bg-gradient-to-b from-sky-900/60 via-cyan-900/70 to-blue-950 p-5 relative min-h-[420px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Tengeri Matricaalbum</h2>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200">
                    {data.stickers.length} db
                  </span>
                </div>

                {data.stickers.length === 0 ? (
                  <p className="text-center text-cyan-200/70 py-16">
                    Még nincs matricád – teljesíts egy feladatot az első tengeri lényhez!
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 relative z-10">
                    {data.stickers.map((st) => {
                      const creature =
                        SEA_CREATURES.find((c) => c.id === st.creatureId) || SEA_CREATURES[0];
                      return (
                        <div
                          key={st.id}
                          title={`${creature.name} – ${st.reason} (${st.date})`}
                          className="aspect-square rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center p-2 shadow-inner hover:scale-105 transition"
                        >
                          <span className="text-3xl sm:text-4xl drop-shadow">{creature.emoji}</span>
                          <span className="text-[10px] text-cyan-100/90 mt-1 truncate w-full text-center">
                            {creature.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {childPage === 'history' && (
            <div className="space-y-4">
              <button
                onClick={() => setChildPage('home')}
                className="flex items-center gap-1.5 text-sm text-cyan-300 hover:text-cyan-100"
              >
                <ArrowLeft className="w-4 h-4" /> Vissza a főoldalra
              </button>

              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" /> Előzmények
              </h2>

              <div className="space-y-2">
                {data.history.length === 0 ? (
                  <p className="text-sm text-slate-400">Még nincsenek bejegyzések.</p>
                ) : (
                  data.history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-100">{item.text}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.date}</div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          item.type === 'earn'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : item.type === 'redeem'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {item.type === 'earn'
                          ? `+${item.amount} matrica`
                          : item.type === 'redeem'
                          ? `-${item.amount} matrica`
                          : item.type === 'jelly_add'
                          ? '+1 medúza'
                          : '-1 medúza'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* SZÜLŐI NÉZET */}
      {viewMode === 'parent' && isParent && (
        <main className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
          <section className="bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-cyan-300">Matrica adása tevékenységért</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {data.tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => awardStickers(t.points, t.title, false)}
                  className="p-3 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 flex items-center justify-between text-left transition"
                >
                  <span className="text-sm font-medium text-slate-100">{t.title}</span>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-cyan-500 text-slate-950 shrink-0 ml-2">
                    +{t.points}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Szabad matricaadás („Más miatt” címen mentve)
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Opcionális megjegyzés..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-16 px-2 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-center"
                />
                <button
                  onClick={() => {
                    awardStickers(customAmount, customReason.trim(), true);
                    setCustomReason('');
                  }}
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-sm"
                >
                  Adás
                </button>
              </div>
            </div>
          </section>

          <section className="bg-rose-950/25 border border-rose-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AngryJellyfishIcon className="w-10 h-10" />
              <div>
                <div className="font-bold text-rose-200">Medúzák száma: {data.jellyfishCount} db</div>
                <div className="text-xs text-rose-300/70">Negatív tevékenységekért adható</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeJellyfish(-1)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
              >
                <MinusCircle className="w-4 h-4" /> Levétele
              </button>
              <button
                onClick={() => changeJellyfish(1)}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" /> Adása
              </button>
            </div>
          </section>

          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-cyan-300">Tevékenységek beállítása</h2>
            <form onSubmit={saveTask} className="flex gap-2">
              <input
                type="text"
                placeholder="Tevékenység neve"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
              />
              <input
                type="number"
                min="1"
                value={newTaskPoints}
                onChange={(e) => setNewTaskPoints(e.target.value)}
                className="w-16 px-2 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-center"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-sm">
                {editingTaskId ? 'Mentés' : 'Hozzáad'}
              </button>
            </form>
            <div className="space-y-2">
              {data.tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 text-sm">
                  <span>
                    {t.title} <strong className="text-cyan-400">({t.points} matrica)</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTaskId(t.id);
                        setNewTaskTitle(t.title);
                        setNewTaskPoints(t.points);
                      }}
                      className="text-slate-400 hover:text-cyan-300"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => saveToDb({ tasks: data.tasks.filter((x) => x.id !== t.id) })}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-cyan-300">Jutalomszintek beállítása</h2>
            <form onSubmit={saveReward} className="flex gap-2">
              <input
                type="text"
                placeholder="Jutalom neve"
                value={newRewardTitle}
                onChange={(e) => setNewRewardTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
              />
              <input
                type="number"
                min="1"
                value={newRewardCost}
                onChange={(e) => setNewRewardCost(e.target.value)}
                className="w-20 px-2 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-center"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-sm">
                {editingRewardId ? 'Mentés' : 'Hozzáad'}
              </button>
            </form>
            <div className="space-y-2">
              {data.rewards.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 text-sm">
                  <span>
                    {r.title} <strong className="text-teal-400">({r.cost} matrica)</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingRewardId(r.id);
                        setNewRewardTitle(r.title);
                        setNewRewardCost(r.cost);
                      }}
                      className="text-slate-400 hover:text-cyan-300"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => saveToDb({ rewards: data.rewards.filter((x) => x.id !== r.id) })}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-amber-300">Nagy Kihívások beállítása</h2>
            <form onSubmit={saveChallenge} className="space-y-2">
              <input
                type="text"
                placeholder="Elérendő cél (pl. 5-ös angolból)"
                value={newChallengeGoal}
                onChange={(e) => setNewChallengeGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Jutalom (pl. Utazás az Azori-szigetekre)"
                  value={newChallengeReward}
                  onChange={(e) => setNewChallengeReward(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-sm">
                  {editingChallengeId ? 'Mentés' : 'Hozzáad'}
                </button>
              </div>
            </form>
            <div className="space-y-2">
              {data.challenges.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 text-sm gap-2">
                  <div>
                    <div className="font-semibold">{c.goal}</div>
                    <div className="text-xs text-slate-400">Jutalom: {c.reward}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        saveToDb({
                          challenges: data.challenges.map((x) =>
                            x.id === c.id ? { ...x, completed: !x.completed } : x
                          ),
                        })
                      }
                      className={`text-xs px-2 py-1 rounded ${
                        c.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.completed ? 'Kész' : 'Folyamatban'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingChallengeId(c.id);
                        setNewChallengeGoal(c.goal);
                        setNewChallengeReward(c.reward);
                      }}
                      className="text-slate-400 hover:text-cyan-300"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => saveToDb({ challenges: data.challenges.filter((x) => x.id !== c.id) })}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="font-bold text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" /> Teljes napló (History)
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.history.map((h) => (
                <div key={h.id} className="text-xs p-2.5 rounded-lg bg-slate-950/60 flex justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200">{h.text}</span>
                    <div className="text-slate-500">
                      {h.date} • {h.by}
                    </div>
                  </div>
                  <span className="font-bold text-cyan-300 shrink-0">
                    {h.type === 'earn'
                      ? `+${h.amount}`
                      : h.type === 'redeem'
                      ? `-${h.amount}`
                      : h.type === 'jelly_add'
                      ? '+1 medúza'
                      : '-1 medúza'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
