import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import TelegramWebApp from "../../TelegramWebApp";

const BACK_URL = process.env.NEXT_PUBLIC_BACK_URL;

interface Gem {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  rotation: number;
  rotationSpeed: number;
}

interface MenuOption {
  id: string;
  label: string;
  icon: string;
  path?: string;
}

const BejeweledMenu = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [gems, setGems] = useState<Gem[]>([]);
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<number | null>(null);

  const router = useRouter();

  const gemColors = [
    "from-red-500 to-red-700",
    "from-blue-400 to-blue-600",
    "from-green-400 to-green-600",
    "from-yellow-300 to-yellow-500",
    "from-purple-400 to-purple-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
  ];

  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.touchAction = "none";

    document.addEventListener("touchmove", preventDefault, { passive: false });
    document.addEventListener("wheel", preventDefault, { passive: false });

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
      document.removeEventListener("touchmove", preventDefault);
      document.removeEventListener("wheel", preventDefault);
    };
  }, []);

  useEffect(() => {
    const createGems = () => {
      const newGems: Gem[] = [];
      for (let i = 0; i < 20; i++) {
        newGems.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 20 + 20,
          color: gemColors[Math.floor(Math.random() * gemColors.length)],
          speed: Math.random() * 0.5 + 0.2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2,
        });
      }
      setGems(newGems);
    };

    createGems();

    const animationInterval = setInterval(() => {
      setGems((prevGems) =>
        prevGems.map((gem) => {
          let newY = gem.y + gem.speed;
          if (newY > 110) {
            newY = -10;
          }

          return {
            ...gem,
            y: newY,
            rotation: (gem.rotation + gem.rotationSpeed) % 360,
          };
        })
      );

      setAnimationFrame((prev) => (prev + 1) % 60);
    }, 50);

    return () => {
      clearInterval(animationInterval);
    };
  }, []);

  const menuOptions: MenuOption[] = [
    { id: "play", label: "ИгратьЕ", icon: "▶️", path: "/game" },
    { id: "levels", label: "Уровни", icon: "🎮", path: "/levels" },
    { id: "shop", label: "Магазин", icon: "🛒", path: "/shop" },
    { id: "awards", label: "Награды", icon: "⚙️", path: "/awards" },
    //{ id: "leaderboard", label: "Рекорды", icon: "🏆" },
  ];

  const [glowIntensity, setGlowIntensity] = useState<number>(0);
  useEffect(() => {
    const glowInterval = setInterval(() => {
      setGlowIntensity((prev) => (prev + 0.1) % 1);
    }, 100);

    return () => clearInterval(glowInterval);
  }, []);

  const handleClick = (path?: string) => {
    if (!path) return;
    setFadeOut(true);
    setTimeout(() => {
      if (path === "/game" && userLevel !== null) {
        router.push(`/game?level=${userLevel}`);
      } else {
        router.push(path);
      }
    }, 400);
  };

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        if (typeof tg.disableVerticalSwipes === "function") {
          tg.disableVerticalSwipes();
        }

        const user = tg.initDataUnsafe?.user;
        if (user) {
          setUserName(user.first_name || null);
        } else {
          setError("Не удалось получить данные пользователя");
        }
      } else {
        setError("Telegram WebApp не доступен");
      }
    } catch (error) {
      console.error("Ошибка при инициализации Telegram WebApp:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Ошибка при инициализации: ${errorMessage}`);
    }
  }, []);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg.initDataUnsafe?.user;
    const fetchUserData = async (username: string) => {
      try {
        const response = await axios.post(`${BACK_URL}/getUserInf`, {
          username: username,
        });
        setUserLevel(response.data.user.level);
      } catch (error) {
        console.log("err with fetch");
      }
    };
    fetchUserData(user.username);
  }, []);

  return (
    <div className="w-full h-screen py-12 bg-gradient-to-b from-purple-900 to-indigo-900 overflow-hidden relative">
      {fadeOut && (
        <div className="absolute inset-0 bg-black opacity-0 animate-fadeOut z-50 pointer-events-none" />
      )}
      {gems.map((gem) => (
        <div
          key={gem.id}
          className={`absolute rounded-lg bg-gradient-to-br ${gem.color} opacity-70 shadow-lg`}
          style={{
            left: `${gem.x}%`,
            top: `${gem.y}%`,
            width: `${gem.size}px`,
            height: `${gem.size}px`,
            transform: `rotate(${gem.rotation}deg)`,
            zIndex: 0,
          }}
        />
      ))}

      <div className="relative h-full flex flex-col items-center justify-between py-12 z-10">
        <div className="mt-6 mb-12 text-center">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 drop-shadow-lg">
            BEJEWELED {userName ? `- Привет, ${userName}` : ""}
          </h1>
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>
        <div className="flex flex-col w-4/5 max-w-sm gap-4">
          {menuOptions.map((option) => (
            <button
              key={option.id}
              className={`relative flex items-center py-4 px-6 rounded-lg text-xl font-bold transition-all duration-300 
                ${
                  selectedOption === option.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-105"
                    : "bg-gradient-to-r from-indigo-700 to-purple-800 text-white hover:scale-105"
                } shadow-lg`}
              style={{
                boxShadow: `0 0 ${
                  10 + Math.sin(glowIntensity * Math.PI * 2) * 10
                }px ${selectedOption === option.id ? "#60a5fa" : "#c4b5fd"}`,
              }}
              onClick={() => {
                setSelectedOption(option.id);
                if (option.path) {
                  handleClick(option.path);
                }
              }}
            >
              <span className="mr-3 text-2xl">{option.icon}</span>
              {option.label}
              <div className="absolute right-4">❯</div>
            </button>
          ))}
        </div>

        <div className="mt-auto mb-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-2"></div>
        </div>
      </div>
    </div>
  );
};

export default BejeweledMenu;
