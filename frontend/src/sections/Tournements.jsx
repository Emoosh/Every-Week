import React, { useState, useEffect, useRef } from "react";

// Alt bileşen: Bir günün maçlarını göstermek için
function DayColumn({ dayIndex, matchDays, getMatchCardStyle, getStatusDisplay, handleMatchClick }) {
    // dayIndex geçerli bir günde mi, kontrol edelim
    // dayIndex out-of-range ise boş bir sütun gösterebilir veya "Bu günde maç bulunmamaktadır." diyebiliriz
    if (dayIndex < 0 || dayIndex >= matchDays.length) {
        return (
            <div className="flex flex-col gap-4 pb-4">
                <div className="bg-gray-800 text-white p-6 rounded-lg text-center">
                    Bu günde maç bulunmamaktadır.
                </div>
            </div>
        );
    }

    const dayData = matchDays[dayIndex];
    const matches = dayData?.matches || [];

    return (
        <div className="flex flex-col gap-4 pb-4">
            {matches.length > 0 ? (
                matches.map((match) => (
                    <div
                        key={match.id}
                        className={`bg-gray-800 text-white p-4 rounded-lg shadow-md 
              ${getMatchCardStyle(match.status)} 
              cursor-pointer hover:bg-gray-700 transition-colors flex flex-col items-center`}
                        onClick={() => handleMatchClick(match)}
                    >
                        {/* Karşılaşma Süresi / Durumu */}
                        <span className="font-medium mb-2">
              {getStatusDisplay(match.status, match.time)}
            </span>

                        {/* Takım İsimleri Solda ve Sağda */}
                        <div className="flex w-full items-center justify-between mb-2">
                            <span className="font-bold">{match.team1}</span>
                            <span className="font-bold">{match.team2}</span>
                        </div>

                        {/* Skor Ortada */}
                        <div className="flex w-full items-center justify-center gap-2">
                            <span className="font-bold text-lg">{match.score1 !== null ? match.score1 : "-"}</span>
                            <span className="font-bold text-lg">-</span>
                            <span className="font-bold text-lg">{match.score2 !== null ? match.score2 : "-"}</span>
                        </div>

                        {/* Detay Bilgisi */}
                        <div className="mt-2 text-center text-sm text-blue-400">
                            Maç detayları için tıklayın
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-gray-800 text-white p-6 rounded-lg text-center">
                    Bu günde maç bulunmamaktadır.
                </div>
            )}
        </div>
    );
}

// Ana component
const TournamentSystem = () => {
    // State: Hangi gün index'i ortada görünüyor
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    // State: Maç günleri verisi
    const [matchDays, setMatchDays] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Seçilen maçın detayları
    const [selectedMatch, setSelectedMatch] = useState(null);
    // Detay modal'ı açık mı?
    const [showDetails, setShowDetails] = useState(false);
    // Aktif görünüm modu: 'days' veya 'teams'
    const [activeView, setActiveView] = useState('days');

    // Hover ile ilgili state ve timer
    const [hoveredColumn, setHoveredColumn] = useState(null);
    const hoverTimerRef = useRef(null);

    // Benzer “fetch” simülasyonu
    useEffect(() => {
        const fetchMatchData = async () => {
            try {
                setLoading(true);
                // Örnek veri, normalde API'den gelir
                const sampleData = [
                    {
                        date: "26 Şubat 2025",
                        dayName: "Bugün",
                        matches: [
                            {
                                id: 1,
                                time: "15:00",
                                team1: "Fnatic",
                                score1: null,
                                team2: "Team Heretics",
                                score2: null,
                                status: "upcoming",
                                matchDetails: null
                            },
                            {
                                id: 2,
                                time: "17:00",
                                team1: "G2 Esports",
                                score1: 1,
                                team2: "GIANTX",
                                score2: 0,
                                status: "live",
                                matchDetails: {
                                    duration: "28:45",
                                    team1Stats: {
                                        kills: 12,
                                        deaths: 5,
                                        assists: 15,
                                        gold: 52400,
                                        towers: 6,
                                        dragons: 2,
                                        barons: 0,
                                        players: [
                                            {
                                                name: "Wunder",
                                                champion: "Garen",
                                                kda: "3/1/2",
                                                cs: 245,
                                                items: ["Stridebreaker", "Dead Man's Plate", "Force of Nature"]
                                            },
                                            {
                                                name: "Jankos",
                                                champion: "Lee Sin",
                                                kda: "3/1/7",
                                                cs: 189,
                                                items: ["Goredrinker", "Death's Dance", "Black Cleaver"]
                                            },
                                            {
                                                name: "Caps",
                                                champion: "Ahri",
                                                kda: "4/0/3",
                                                cs: 267,
                                                items: ["Luden's Echo", "Shadowflame", "Rabadon's Deathcap"]
                                            },
                                            {
                                                name: "Flakked",
                                                champion: "Jinx",
                                                kda: "2/1/6",
                                                cs: 255,
                                                items: ["Kraken Slayer", "Infinity Edge", "Bloodthirster"]
                                            },
                                            {
                                                name: "Mikyx",
                                                champion: "Nautilus",
                                                kda: "0/2/8",
                                                cs: 33,
                                                items: ["Locket of the Iron Solari", "Knight's Vow", "Thornmail"]
                                            }
                                        ]
                                    },
                                    team2Stats: {
                                        kills: 5,
                                        deaths: 12,
                                        assists: 8,
                                        gold: 42100,
                                        towers: 1,
                                        dragons: 1,
                                        barons: 0,
                                        players: [
                                            {
                                                name: "Fazzzy",
                                                champion: "Ornn",
                                                kda: "0/3/2",
                                                cs: 223,
                                                items: ["Sunfire Aegis", "Thornmail", "Warmog's Armor"]
                                            },
                                            {
                                                name: "Bruder",
                                                champion: "Vi",
                                                kda: "2/2/1",
                                                cs: 155,
                                                items: ["Divine Sunderer", "Sterak's Gage", "Dead Man's Plate"]
                                            },
                                            {
                                                name: "Ruby",
                                                champion: "Viktor",
                                                kda: "1/3/1",
                                                cs: 245,
                                                items: ["Crown of the Shattered Queen", "Cosmic Drive", "Zhonya's Hourglass"]
                                            },
                                            {
                                                name: "Shiganari",
                                                champion: "Samira",
                                                kda: "2/2/2",
                                                cs: 228,
                                                items: ["Immortal Shieldbow", "Collector", "Bloodthirster"]
                                            },
                                            {
                                                name: "Rhuckz",
                                                champion: "Leona",
                                                kda: "0/2/2",
                                                cs: 28,
                                                items: ["Locket of the Iron Solari", "Zeke's Convergence", "Frozen Heart"]
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                id: 3,
                                time: "19:00",
                                team1: "Movistar KOI",
                                score1: 2,
                                team2: "Team BDS",
                                score2: 0,
                                status: "completed",
                                matchDetails: {
                                    duration: "32:17",
                                    team1Stats: {
                                        kills: 18,
                                        deaths: 7,
                                        assists: 22,
                                        gold: 62300,
                                        towers: 9,
                                        dragons: 3,
                                        barons: 1,
                                        players: [
                                            {
                                                name: "Odoamne",
                                                champion: "Jax",
                                                kda: "4/1/3",
                                                cs: 266,
                                                items: ["Trinity Force", "Death's Dance", "Guardian Angel"]
                                            },
                                            {
                                                name: "Elyoya",
                                                champion: "Viego",
                                                kda: "5/2/5",
                                                cs: 201,
                                                items: ["Divine Sunderer", "Blade of the Ruined King", "Death's Dance"]
                                            },
                                            {
                                                name: "Larssen",
                                                champion: "Azir",
                                                kda: "4/1/5",
                                                cs: 288,
                                                items: ["Liandry's Anguish", "Nashor's Tooth", "Zhonya's Hourglass"]
                                            },
                                            {
                                                name: "Comp",
                                                champion: "Xayah",
                                                kda: "5/1/4",
                                                cs: 277,
                                                items: ["Galeforce", "Infinity Edge", "Rapid Firecannon"]
                                            },
                                            {
                                                name: "Trymbi",
                                                champion: "Rakan",
                                                kda: "0/2/15",
                                                cs: 38,
                                                items: ["Shurelya's Battlesong", "Redemption", "Vigilant Wardstone"]
                                            }
                                        ]
                                    },
                                    team2Stats: {
                                        kills: 7,
                                        deaths: 18,
                                        assists: 13,
                                        gold: 47200,
                                        towers: 2,
                                        dragons: 1,
                                        barons: 0,
                                        players: [
                                            {
                                                name: "Adam",
                                                champion: "Aatrox",
                                                kda: "2/4/1",
                                                cs: 233,
                                                items: ["Goredrinker", "Death's Dance", "Black Cleaver"]
                                            },
                                            {
                                                name: "Sheo",
                                                champion: "Bel'Veth",
                                                kda: "2/3/2",
                                                cs: 182,
                                                items: ["Kraken Slayer", "Death's Dance", "Blade of the Ruined King"]
                                            },
                                            {
                                                name: "nuc",
                                                champion: "Orianna",
                                                kda: "1/3/4",
                                                cs: 252,
                                                items: ["Luden's Echo", "Archangel's Staff", "Void Staff"]
                                            },
                                            {
                                                name: "Crownie",
                                                champion: "Lucian",
                                                kda: "2/3/3",
                                                cs: 241,
                                                items: ["Galeforce", "Navori Quickblades", "Infinity Edge"]
                                            },
                                            {
                                                name: "Labrov",
                                                champion: "Nami",
                                                kda: "0/5/3",
                                                cs: 31,
                                                items: ["Moonstone Renewer", "Ardent Censer", "Chemtech Putrifier"]
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                id: 4,
                                time: "21:00",
                                team1: "Karmine Corp",
                                score1: null,
                                team2: "Team Vitality",
                                score2: null,
                                status: "upcoming",
                                matchDetails: null
                            }
                        ]
                    },
                    {
                        date: "27 Şubat 2025",
                        dayName: "Yarın",
                        matches: [
                            {
                                id: 5,
                                time: "16:00",
                                team1: "Fnatic",
                                score1: null,
                                team2: "G2 Esports",
                                score2: null,
                                status: "upcoming",
                                matchDetails: null
                            },
                            {
                                id: 6,
                                time: "18:00",
                                team1: "Karmine Corp",
                                score1: null,
                                team2: "Movistar KOI",
                                score2: null,
                                status: "upcoming",
                                matchDetails: null
                            }
                        ]
                    },
                    {
                        date: "28 Şubat 2025",
                        dayName: "Perşembe",
                        matches: [
                            {
                                id: 7,
                                time: "19:00",
                                team1: "G2 Esports",
                                score1: null,
                                team2: "Karmine Corp",
                                score2: null,
                                status: "upcoming",
                                matchDetails: null
                            }
                        ]
                    }
                ];

                setMatchDays(sampleData);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch match data:", error);
                setLoading(false);
            }
        };

        fetchMatchData();
    }, []);

    // Hover Sütununa Girdiğimizde (sol veya sağ)
    const handleMouseEnter = (column) => {
        setHoveredColumn(column);

        // 5 saniye sonunda gün kaydır
        hoverTimerRef.current = setTimeout(() => {
            setCurrentDayIndex((prev) => {
                // Eğer sola gidiyorsak ve index sınırı geçmiyorsa azalt
                if (column === "left" && prev > 0) {
                    return prev - 1;
                }
                // Eğer sağa gidiyorsak ve index sınırını aşmıyorsak artır
                if (column === "right" && prev < matchDays.length - 1) {
                    return prev + 1;
                }
                return prev; // Sınır aşılırsa değiştirme
            });
        }, 5000);
    };


    // Hover Sütunundan Ayrıldığımızda
    const handleMouseLeave = () => {
        setHoveredColumn(null);
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }
    };

    // Maça tıklanınca detay aç
    const handleMatchClick = (match) => {
        setSelectedMatch(match);
        setShowDetails(true);

        // Eğer matchDetails yoksa ve upcoming değilse (canlı/bitmiş), API'den fetch edebilirdiniz
    };

    // Detaydan çık
    const closeDetails = () => {
        setShowDetails(false);
        setSelectedMatch(null);
    };

    // Maç kutusunun sol kenar rengini duruma göre ayarla
    const getMatchCardStyle = (status) => {
        switch (status) {
            case "live":
                return "border-l-4 border-red-500";
            case "completed":
                return "border-l-4 border-green-500";
            default:
                return "border-l-4 border-gray-600";
        }
    };

    // Maçın durumunu (CANLI, Tamamlandı, vs.) gösteren metod
    const getStatusDisplay = (status, time) => {
        switch (status) {
            case "live":
                return <span className="text-red-500 font-bold">CANLI</span>;
            case "completed":
                return <span className="text-green-500">Tamamlandı</span>;
            default:
                return <span className="text-gray-400">{time}</span>;
        }
    };

    // Maç Detayları bileşeni
    const MatchDetails = ({ match }) => {
        if (!match) return null;

        // Upcoming maçsa sadece önizleme göster
        if (match.status === "upcoming") {
            return (
                <div className="w-full h-screen bg-gray-900 flex flex-col p-4 overflow-auto">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={closeDetails}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            ← Geri Dön
                        </button>
                        <h2 className="text-xl font-bold text-white">Maç Önizlemesi</h2>
                        <div className="w-24"></div> {/* Spacer */}
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 text-white">
                        <div className="flex justify-between items-center mb-8">
                            <div className="text-center w-1/3">
                                <div className="text-3xl font-bold mb-2">{match.team1}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400 mb-2">VS</div>
                                <div className="text-xl">{match.time}</div>
                            </div>
                            <div className="text-center w-1/3">
                                <div className="text-3xl font-bold mb-2">{match.team2}</div>
                            </div>
                        </div>

                        <div className="text-center my-12">
                            <p className="text-xl">Bu maç henüz başlamadı.</p>
                            <p className="text-lg mt-4 text-gray-400">
                                Maç başladığında istatistikler ve canlı skor burada görüntülenecektir.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // Live veya completed maç için
        const { matchDetails } = match;
        if (!matchDetails) {
            return (
                <div className="w-full h-screen bg-gray-900 flex flex-col justify-center items-center text-white">
                    <div className="text-xl">Maç detayları yükleniyor...</div>
                </div>
            );
        }

        return (
            <div className="w-full h-screen bg-gray-900 flex flex-col p-4 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={closeDetails}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        ← Geri Dön
                    </button>
                    <h2 className="text-xl font-bold text-white">
                        {match.status === "live" ? "CANLI MAÇ" : "Maç Özeti"}
                    </h2>
                    <div className="w-24"></div> {/* Spacer */}
                </div>

                {/* Match Header */}
                <div className="bg-gray-800 rounded-lg p-6 text-white mb-6">
                    <div className="flex justify-between items-center">
                        <div className="text-center w-1/3">
                            <div className="text-3xl font-bold mb-2">{match.team1}</div>
                            <div className="text-5xl font-bold text-blue-400">{match.score1}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-400 mb-2">VS</div>
                            <div className="text-md">Süre: {matchDetails.duration}</div>
                        </div>
                        <div className="text-center w-1/3">
                            <div className="text-3xl font-bold mb-2">{match.team2}</div>
                            <div className="text-5xl font-bold text-red-400">{match.score2}</div>
                        </div>
                    </div>
                </div>

                {/* Match Stats */}
                <div className="bg-gray-800 rounded-lg p-6 text-white mb-6">
                    <h3 className="text-xl font-bold mb-4 text-center">Takım İstatistikleri</h3>

                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right w-1/3 font-bold text-blue-400">
                            {matchDetails.team1Stats.kills}
                        </div>
                        <div className="text-center w-1/3">Öldürme</div>
                        <div className="text-left w-1/3 font-bold text-red-400">
                            {matchDetails.team2Stats.kills}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right w-1/3 font-bold text-blue-400">
                            {matchDetails.team1Stats.deaths}
                        </div>
                        <div className="text-center w-1/3">Ölüm</div>
                        <div className="text-left w-1/3 font-bold text-red-400">
                            {matchDetails.team2Stats.deaths}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right w-1/3 font-bold text-blue-400">
                            {matchDetails.team1Stats.assists}
                        </div>
                        <div className="text-center w-1/3">Asist</div>
                        <div className="text-left w-1/3 font-bold text-red-400">
                            {matchDetails.team2Stats.assists}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right w-1/3 font-bold text-blue-400">
                            {matchDetails.team1Stats.gold.toLocaleString()}
                        </div>
                        <div className="text-center w-1/3">Altın</div>
                        <div className="text-left w-1/3 font-bold text-red-400">
                            {matchDetails.team2Stats.gold.toLocaleString()}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right w-1/3 font-bold text-blue-400">
                            {matchDetails.team1Stats.towers}
                        </div>
                        <div className="text-center w-1/3">Kule</div>
                        <div className="text-left w-1/3 font-bold text-red-400">
                            {matchDetails.team2Stats.towers}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right w-1/3 font-bold text-blue-400">
                            {matchDetails.team1Stats.dragons}
                        </div>
                        <div className="text-center w-1/3">Ejder</div>
                        <div className="text-left w-1/3 font-bold text-red-400">
                            {matchDetails.team2Stats.dragons}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-right w-1/3 font-bold text-blue-400">
                            {matchDetails.team1Stats.barons}
                        </div>
                        <div className="text-center w-1/3">Baron</div>
                        <div className="text-left w-1/3 font-bold text-red-400">
                            {matchDetails.team2Stats.barons}
                        </div>
                    </div>
                </div>

                {/* Player Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Team 1 Players */}
                    <div className="bg-gray-800 rounded-lg p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">{match.team1} Oyuncuları</h3>
                        {matchDetails.team1Stats.players.map((player, index) => (
                            <div
                                key={index}
                                className="mb-4 border-b border-gray-700 pb-4 last:border-0 last:pb-0"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">{player.name}</span>
                                    <span className="text-gray-400">{player.champion}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>KDA: {player.kda}</span>
                                    <span>CS: {player.cs}</span>
                                </div>
                                <div className="mt-2 text-sm">
                                    <span className="text-gray-400">Eşyalar: </span>
                                    {player.items.join(", ")}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Team 2 Players */}
                    <div className="bg-gray-800 rounded-lg p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">{match.team2} Oyuncuları</h3>
                        {matchDetails.team2Stats.players.map((player, index) => (
                            <div
                                key={index}
                                className="mb-4 border-b border-gray-700 pb-4 last:border-0 last:pb-0"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">{player.name}</span>
                                    <span className="text-gray-400">{player.champion}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>KDA: {player.kda}</span>
                                    <span>CS: {player.cs}</span>
                                </div>
                                <div className="mt-2 text-sm">
                                    <span className="text-gray-400">Eşyalar: </span>
                                    {player.items.join(", ")}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="w-full h-screen bg-gray-900 flex justify-center items-center">
                <div className="text-white text-xl">Yükleniyor...</div>
            </div>
        );
    }

    // Eğer bir maç detayı açık ise, Detayları göster
    if (showDetails && selectedMatch) {
        return <MatchDetails match={selectedMatch} />;
    }

    // 3 Column Layout (Dün - Bugün - Yarın)
    return (
        <div className="w-full h-screen bg-gray-900 flex overflow-hidden">
            {/* Sütun: Dün */}
            <div
                className={`
          w-1/3 p-4 transition-all duration-300 
          ${hoveredColumn === "left" ? "blur-none" : "blur-sm"}
        `}
                onMouseEnter={() => handleMouseEnter("left")}
                onMouseLeave={handleMouseLeave}
            >
                <h2 className="text-white text-center mb-4 font-bold">
                    {matchDays[currentDayIndex - 1]?.dayName ?? "Dün"}
                </h2>
                <DayColumn
                    dayIndex={currentDayIndex - 1}
                    matchDays={matchDays}
                    getMatchCardStyle={getMatchCardStyle}
                    getStatusDisplay={getStatusDisplay}
                    handleMatchClick={handleMatchClick}
                />
            </div>

            {/* Sütun: Bugün */}
            <div className="w-1/3 p-4">
                <h2 className="text-white text-center mb-4 font-bold">
                    {matchDays[currentDayIndex]?.dayName ?? "Bugün"} - {matchDays[currentDayIndex]?.date ?? ""}
                </h2>
                <DayColumn
                    dayIndex={currentDayIndex}
                    matchDays={matchDays}
                    getMatchCardStyle={getMatchCardStyle}
                    getStatusDisplay={getStatusDisplay}
                    handleMatchClick={handleMatchClick}
                />
            </div>

            {/* Sütun: Yarın */}
            <div
                className={`
          w-1/3 p-4 transition-all duration-300
          ${hoveredColumn === "right" ? "blur-none" : "blur-sm"}
        `}
                onMouseEnter={() => handleMouseEnter("right")}
                onMouseLeave={handleMouseLeave}
            >
                <h2 className="text-white text-center mb-4 font-bold">
                    {matchDays[currentDayIndex + 1]?.dayName ?? "Yarın"}
                </h2>
                <DayColumn
                    dayIndex={currentDayIndex + 1}
                    matchDays={matchDays}
                    getMatchCardStyle={getMatchCardStyle}
                    getStatusDisplay={getStatusDisplay}
                    handleMatchClick={handleMatchClick}
                />
            </div>
        </div>
    );
};

export default TournamentSystem;
