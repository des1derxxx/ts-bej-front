import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios, { AxiosError } from "axios";

const BACK_URL = process.env.NEXT_PUBLIC_BACK_URL;

interface Position {
  angle: number;
  distance: number;
}

interface Planet {
  id: string;
  number: number;
  unlocked: boolean;
  difficulty: "easy" | "medium" | "hard" | "boss";
  type: string;
  completed: boolean;
  perfect: boolean;
  stars: number;
  position: Position;
}

interface GalaxySystem {
  id: number;
  unlocked: boolean;
  planets: Planet[];
}

interface UserStars {
  [key: string]: number;
}

interface UserData {
  username: string;
  level: number;
  stars: UserStars | Map<string, number> | string;
}

interface GalaxyConfig {
  systems: number;
  planetsPerSystem: number;
}

interface UnlockedContent {
  unlockedSystems: number;
  unlockedPlanets: number[];
}

const GalaxyLevels = () => {
  const router = useRouter();
  const [galaxy, setGalaxy] = useState<GalaxySystem[]>([]);
  const [currentSystem, setCurrentSystem] = useState<number>(1);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Конфигурация галактики
  const galaxyConfig: GalaxyConfig = {
    systems: 5,
    planetsPerSystem: 10,
  };

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async (): Promise<void> => {
      try {
        // Get user data from Telegram WebApp
        const tg = (window as any).Telegram?.WebApp;

        if (!tg || !tg.initDataUnsafe?.user?.username) {
          console.error("Telegram WebApp user not found");

          // Fallback for development or when Telegram WebApp is not available
          setUserData({
            username: "testuser",
            level: 15,
            stars: {
              level_1: 3,
              level_2: 2,
              level_3: 3,
              level_4: 1,
              level_5: 0,
            },
          });
          setLoading(false);
          return;
        }

        const username = tg.initDataUnsafe.user.username;

        try {
          const response = await axios.post<{ user: UserData }>(
            `${BACK_URL}/getUserInf`,
            {
              username,
            }
          );
          setUserData(response.data.user);
        } catch (apiError) {
          console.error("API Error:", apiError);
          const errorMessage =
            apiError instanceof AxiosError
              ? apiError.response?.data?.message || apiError.message
              : "Неизвестная ошибка при получении данных пользователя";

          // Try alternative endpoint as fallback
          try {
            const altResponse = await axios.post<{ user: UserData }>(
              `${BACK_URL}/getUserInf`,
              {
                username,
              }
            );
            setUserData(altResponse.data.user);
          } catch (altError) {
            console.error("Alternative API also failed:", altError);

            // Create mock user data for development/testing
            setUserData({
              username: username || "testuser",
              level: 15,
              stars: {
                level_1: 3,
                level_2: 2,
                level_3: 3,
                level_4: 1,
              },
            });

            setError(
              "Не удалось подключиться к серверу. Используются демо-данные."
            );
          }
        }

        setLoading(false);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error fetching user data:", errorMessage);
        setError(
          "Не удалось загрузить данные пользователя. Пожалуйста, попробуйте позже."
        );
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Calculate unlocked systems and planets based on user level
  const calculateUnlockedContent = (userLevel: number): UnlockedContent => {
    const unlockedSystems = Math.min(
      Math.ceil(userLevel / 10),
      galaxyConfig.systems
    );

    const unlockedPlanets = Array(galaxyConfig.systems)
      .fill(0)
      .map((_, index) => {
        if (index + 1 > unlockedSystems) return 0;
        if (index + 1 < unlockedSystems) return galaxyConfig.planetsPerSystem;

        if (index === 0) {
          return Math.min(userLevel, galaxyConfig.planetsPerSystem);
        }

        const levelWithinSystem = userLevel - index * 10;
        return Math.min(
          Math.ceil(levelWithinSystem * (galaxyConfig.planetsPerSystem / 10)),
          galaxyConfig.planetsPerSystem
        );
      });

    return { unlockedSystems, unlockedPlanets };
  };

  // Генерация данных об уровнях с учетом прогресса пользователя
  const generateGalaxy = (userData: UserData): GalaxySystem[] => {
    const { unlockedSystems, unlockedPlanets } = calculateUnlockedContent(
      userData.level
    );
    const galaxy: GalaxySystem[] = [];
    const difficulties: ("easy" | "medium" | "hard" | "boss")[] = [
      "easy",
      "medium",
      "hard",
      "boss",
    ];
    const planetTypes = ["🌍", "🌕", "🪐", "🌟", "☄️", "🌌", "🌑", "🌋"];

    for (let s = 0; s < galaxyConfig.systems; s++) {
      const system: GalaxySystem = {
        id: s + 1,
        unlocked: s < unlockedSystems,
        planets: [],
      };

      for (let p = 0; p < galaxyConfig.planetsPerSystem; p++) {
        const levelNumber = s * galaxyConfig.planetsPerSystem + p + 1;
        const levelKey = `level_${levelNumber}`;

        let starCount = 0;
        if (userData.stars) {
          if (userData.stars instanceof Map) {
            starCount = userData.stars.get(levelKey) || 0;
          } else if (typeof userData.stars === "object") {
            starCount = userData.stars[levelKey] || 0;
          } else if (typeof userData.stars === "string") {
            try {
              const starsObj = JSON.parse(userData.stars);
              starCount = starsObj[levelKey] || 0;
            } catch (e) {
              console.error("Failed to parse stars string:", e);
            }
          }
        }

        system.planets.push({
          id: `${s + 1}-${p + 1}`,
          number: levelNumber,
          unlocked: p < unlockedPlanets[s],
          difficulty: difficulties[Math.min(s, difficulties.length - 1)],
          type: planetTypes[p % planetTypes.length],
          completed: starCount > 0,
          perfect: starCount === 3,
          stars: starCount,
          position: {
            angle: (p / galaxyConfig.planetsPerSystem) * Math.PI * 2,
            distance: 100 + Math.random() * 20,
          },
        });
      }

      galaxy.push(system);
    }

    return galaxy;
  };

  // Use effect to load galaxy data
  useEffect(() => {
    if (userData) {
      const galaxyData = generateGalaxy(userData);
      setGalaxy(galaxyData);
    }
  }, [userData]);

  const handlePlanetClick = (planet: Planet): void => {
    if (!planet.unlocked) return;

    setSelectedPlanet(planet.id);
    setIsZoomed(true);

    setTimeout(() => {
      router.push(`/game?level=${planet.number}`);
    }, 1000);
  };

  const handleSystemChange = (systemId: number): void => {
    setCurrentSystem(systemId);
    setSelectedPlanet(null);
    setIsZoomed(false);
  };

  // Styles for planets
  const getPlanetStyle = (planet: Planet): string => {
    const base =
      "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-xl transition-all duration-500";

    if (!planet.unlocked)
      return `${base} bg-gray-800 text-gray-500 border-2 border-gray-600 cursor-default`;

    if (planet.perfect)
      return `${base} bg-gradient-to-br from-yellow-300 to-amber-500 text-white cursor-pointer hover:scale-110`;

    if (planet.completed)
      return `${base} bg-gradient-to-br from-blue-400 to-indigo-600 text-white cursor-pointer hover:scale-110`;

    switch (planet.difficulty) {
      case "easy":
        return `${base} bg-gradient-to-br from-green-400 to-emerald-600 text-white cursor-pointer hover:scale-110`;
      case "medium":
        return `${base} bg-gradient-to-br from-amber-400 to-orange-500 text-white cursor-pointer hover:scale-110`;
      case "hard":
        return `${base} bg-gradient-to-br from-rose-500 to-pink-700 text-white cursor-pointer hover:scale-110`;
      case "boss":
        return `${base} bg-gradient-to-br from-purple-600 to-indigo-800 text-white cursor-pointer hover:scale-110`;
      default:
        return base;
    }
  };

  // Animation for orbits
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Early return with loading state
  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Загрузка галактики...</div>
      </div>
    );
  }

  // Return if no user data or galaxy
  if (!userData || !galaxy.length) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center">
        <div className="text-white text-xl mb-4">
          Ошибка загрузки данных галактики
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Get current system data
  const currentSystemData = galaxy[currentSystem - 1];

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 to-black overflow-hidden flex flex-col">
      {/* Фоновые звезды */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${Math.random() * 5 + 3}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Верхняя панель - объединенные элементы */}
      <div className="relative z-30 w-full py-4 px-6 mt-20 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm">
        {/* Кнопка назад */}
        <button
          onClick={() => router.push("/menu")}
          className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700/90 rounded-full text-white transition-all flex items-center"
        >
          <span className="mr-1">←</span> Назад
        </button>
        {/* Информация о системе и игроке */}
        <div className="flex items-center space-x-4">
          {/* Уровень игрока */}
          <div className="bg-blue-800/80 backdrop-blur rounded-lg p-3 text-white text-sm">
            <h3 className="font-bold">Уровень: {userData.level}</h3>
            <p>
              XP: {userData.level * 100}/{(userData.level + 1) * 100}
            </p>
          </div>

          {/* Информация о системе */}
          <div className="bg-gray-800/80 backdrop-blur rounded-lg p-3 text-white text-sm">
            <h3 className="font-bold">Система {currentSystem}</h3>
            <p>
              {currentSystemData.unlocked
                ? `Открыто: ${
                    currentSystemData.planets.filter((p) => p.unlocked).length
                  }/${galaxyConfig.planetsPerSystem}`
                : "Заблокирована"}
            </p>
          </div>
        </div>
      </div>

      {/* Основное содержимое - центрировано */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Центральное солнце системы */}
        <div
          className={`relative z-10 ${
            isZoomed ? "scale-150" : ""
          } transition-all duration-1000 mb-8`}
        >
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-amber-500 to-red-600 shadow-lg shadow-amber-500/30 animate-pulse-slow flex items-center justify-center">
            <span className="text-white text-lg md:text-xl font-bold">
              S-{currentSystem}
            </span>
          </div>
        </div>

        {/* Планеты/уровни */}
        <div className="relative w-full max-w-2xl h-96">
          {currentSystemData.planets.map((planet) => {
            const isSelected = selectedPlanet === planet.id;
            const distance =
              isZoomed && isSelected ? 150 : planet.position.distance;
            const scale = isSelected ? (isZoomed ? 1.8 : 1.3) : 1;

            return (
              <div
                key={planet.id}
                className={`absolute top-1/2 left-1/2 transition-all duration-1000 z-10
                  ${isSelected ? "z-20" : ""}`}
                style={{
                  transform: `
                    translate(-50%, -50%)
                    translate(${
                      Math.cos(planet.position.angle) * distance
                    }px, ${Math.sin(planet.position.angle) * distance}px)
                    scale(${scale})
                  `,
                  transitionDelay:
                    isZoomed && !isSelected ? `${planet.number * 50}ms` : "0ms",
                }}
                onClick={() => handlePlanetClick(planet)}
              >
                <div className={getPlanetStyle(planet)}>
                  {planet.type}
                  {!planet.unlocked && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                      <span className="text-xs">🔒</span>
                    </div>
                  )}
                </div>

                {/* Индикатор уровня и звезд */}
                <div
                  className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center 
                  ${planet.unlocked ? "text-white" : "text-gray-500"}`}
                >
                  <div className="text-xs font-bold">{planet.number}</div>
                  <div className="flex justify-center space-x-1 mt-1">
                    {[1, 2, 3].map((star) => (
                      <span
                        key={star}
                        className={`text-xs ${
                          star <= planet.stars
                            ? "text-yellow-400"
                            : "text-gray-400"
                        }`}
                      >
                        {star <= planet.stars ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Навигация по системам - внизу */}
      <div className="relative z-30 w-full py-8 px-6 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex justify-center space-x-3">
          {galaxy.map((system) => (
            <button
              key={system.id}
              onClick={() => handleSystemChange(system.id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                ${
                  currentSystem === system.id
                    ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg scale-110"
                    : system.unlocked
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-800 text-gray-500 cursor-default"
                }`}
              disabled={!system.unlocked}
            >
              {system.id}
            </button>
          ))}
        </div>
      </div>

      {/* Глобальные стили анимаций */}
      <style jsx global>{`
        @keyframes twinkle {
          0% {
            opacity: 0.3;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s infinite;
        }
      `}</style>
    </div>
  );
};

export default GalaxyLevels;
