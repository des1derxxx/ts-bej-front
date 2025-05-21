import { useState, useEffect, useRef } from "react";
import axios from "axios";

// Базовые интерфейсы для данных
interface NFT {
  _id: string;
  nftId: number;
  name: string;
  rarity: string;
  counter: number;
  path?: string;
  obtainedAt?: string;
}

interface UserInfo {
  username: string;
  bombs: number;
  mix: number;
  cases: number;
}

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

const Shop = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [glowIntensity, setGlowIntensity] = useState<number>(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"items" | "nft" | "my-nft">(
    "items"
  );
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  const [gems, setGems] = useState<Gem[]>([]);
  const [isBrowser, setIsBrowser] = useState<boolean>(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [showCaseOpening, setShowCaseOpening] = useState<boolean>(false);
  const [caseAnimationStage, setCaseAnimationStage] = useState<number>(0);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [possibleNfts, setPossibleNfts] = useState<NFT[]>([]);
  const [scrollingNfts, setScrollingNfts] = useState<NFT[]>([]);
  const [currentScrollingIndex, setCurrentScrollingIndex] = useState<number>(0);
  const [userNfts, setUserNfts] = useState<NFT[]>([]);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const backUrl = process.env.NEXT_PUBLIC_BACK_URL;

  const shopItems = [
    {
      id: 1,
      name: "Бомбочка",
      icon: "💣",
      description: "Уничтожает выбранный камень и соседние камни",
      price: 100,
      type: "bomb",
    },
    {
      id: 2,
      name: "Микс",
      icon: "🔄",
      description: "Перемешивает все камни на поле",
      price: 150,
      type: "mix",
    },
    {
      id: 3,
      name: "Супер бомба",
      icon: "💥",
      description: "Уничтожает большую область камней",
      price: 250,
      type: "superBomb",
    },
  ];

  const rarityMap = {
    common: "Обычный",
    uncommon: "Необычный",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный",
  };

  const rarityIcons = {
    common: "🔹",
    uncommon: "🔷",
    rare: "✨",
    epic: "🌟",
    legendary: "👑",
  };

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
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    const fetchNfts = async () => {
      try {
        const response = await axios.get(`${backUrl}/getAllNft`);
        setNfts(response.data);
        console.log("NFTs loaded:", response.data);

        setPossibleNfts(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке NFT:", error);
        setDebugInfo(`Ошибка при загрузке NFT: ${error}`);

        setPossibleNfts([
          {
            _id: "nft1",
            nftId: 1,
            name: "Древний Кристалл",
            rarity: "rare",
            counter: 0,
            path: "/nft/crystal.png",
          },
          {
            _id: "nft2",
            nftId: 2,
            name: "Изумрудный Осколок",
            rarity: "uncommon",
            counter: 0,
            path: "/nft/emerald.png",
          },
          {
            _id: "nft3",
            nftId: 3,
            name: "Корона Короля",
            rarity: "legendary",
            counter: 0,
            path: "/nft/crown.png",
          },
          {
            _id: "nft4",
            nftId: 4,
            name: "Магический Амулет",
            rarity: "epic",
            counter: 0,
            path: "/nft/amulet.png",
          },
          {
            _id: "nft5",
            nftId: 5,
            name: "Обычный Камень",
            rarity: "common",
            counter: 0,
            path: "/nft/stone.png",
          },
        ]);
      }
    };

    if (isBrowser) {
      fetchNfts();
    }
  }, [isBrowser, backUrl]);

  useEffect(() => {
    if (!isBrowser) return;

    const newGems: Gem[] = [];
    const isMobile = window.innerWidth < 768;
    const gemCount = isMobile ? 15 : 20;

    for (let i = 0; i < gemCount; i++) {
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
  }, [isBrowser]);

  const getTelegramUser = () => {
    try {
      const webApp = (window as any).Telegram?.WebApp;
      if (!webApp) return null;

      const user = webApp.initDataUnsafe?.user;
      if (!user) return null;

      return {
        username: typeof user.username === "string" ? user.username : undefined,
        firstName:
          typeof user.first_name === "string" ? user.first_name : undefined,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!isBrowser) return;

    try {
      const user = getTelegramUser();

      if (user) {
        setUserName(user.firstName || null);
        setDebugInfo(
          `Found Telegram user: ${user.username || "no username"}, ${
            user.firstName || "no first name"
          }`
        );

        if (user.username) {
          fetchUserInfo(user.username);
        } else {
          setDebugInfo("No username found in Telegram data");
          setLoading(false);
          setError("Не удалось получить имя пользователя из Telegram");
        }
      } else {
        setDebugInfo("Telegram WebApp not available");
        setLoading(false);
        fetchUserInfo("des1derx");
      }
    } catch (error) {
      if (error instanceof Error) {
        setDebugInfo(`Error in Telegram init: ${error.message}`);
      }
      setLoading(false);
      setError("Ошибка при инициализации Telegram WebApp");
    }
  }, [isBrowser]);

  const fetchUserInfo = async (username: string) => {
    try {
      setLoading(true);
      setDebugInfo(`Attempting to fetch data for user: ${username}`);

      const response = await axios.post<{ user: UserInfo }>(
        `${backUrl}/getUserInf`,
        {
          username: username,
        }
      );

      setUserInfo(response.data.user);
      setDebugInfo(
        `Data loaded successfully: ${JSON.stringify(response.data.user)}`
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user info:", error);

      let errorMessage = "Не удалось загрузить информацию о пользователе";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage += ` (Статус: ${error.response.status})`;
          setDebugInfo(
            `API Error: ${error.response.status} - ${JSON.stringify(
              error.response.data
            )}`
          );
        } else if (error.request) {
          errorMessage += " (Нет ответа от сервера)";
          setDebugInfo(`Network Error: Request made but no response received`);
        } else {
          errorMessage += ` (${error.message})`;
          setDebugInfo(`Request Error: ${error.message}`);
        }
      }

      setError(errorMessage);
      setLoading(false);

      setUserInfo({
        username: username,
        bombs: 3,
        mix: 4,
        cases: 2,
      });
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".allow-scroll")) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    if (!isBrowser) return;

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
  }, [isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;

    const interval = setInterval(() => {
      setGlowIntensity((prev) => (prev + 0.01) % 1);
    }, 50);

    return () => clearInterval(interval);
  }, [isBrowser]);

  useEffect(() => {
    if (!showCaseOpening) return;

    if (caseAnimationStage === 1) {
      const spinDuration = 3000; // 3 seconds

      const spinTimer = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * possibleNfts.length);
        setSelectedNft(possibleNfts[randomIndex]);
        setCaseAnimationStage(2);
      }, spinDuration);

      return () => clearTimeout(spinTimer);
    }

    if (caseAnimationStage === 2) {
      const resultTimer = setTimeout(() => {
        closeCase();
      }, 3000);

      return () => clearTimeout(resultTimer);
    }
  }, [showCaseOpening, caseAnimationStage, possibleNfts]);

  const handleBuyItem = (item: { id: number; name: string }) => {
    setSelectedItem(item.id);
    console.log(`Buying ${item.name}`);
  };

  const handleOpenCase = async () => {
    try {
      if (!userInfo?.username) return;

      const response = await axios.post<{ nft: NFT; remainingCases: number }>(
        `${backUrl}/openCase`,
        {
          username: userInfo.username,
        }
      );

      if (response.data && response.data.nft) {
        startNftScrolling(response.data.nft);

        setUserInfo((prev) =>
          prev
            ? {
                ...prev,
                cases: response.data.remainingCases,
              }
            : null
        );

        await fetchUserNfts();
      }
    } catch (error) {
      console.error("Ошибка при открытии кейса:", error);
      if (error instanceof Error) {
        setDebugInfo(`Ошибка при открытии кейса: ${error.message}`);
      }
      closeCase();
    }
  };

  const startNftScrolling = (targetNft: NFT) => {
    setShowCaseOpening(true);
    setCaseAnimationStage(1);

    const targetIndex = possibleNfts.findIndex(
      (nft) => nft._id === targetNft._id
    );

    const scrollArray = [
      ...possibleNfts.slice(targetIndex),
      ...possibleNfts,
      ...possibleNfts,
      targetNft,
    ];

    setScrollingNfts(scrollArray);
    setCurrentScrollingIndex(0);

    let speed = 100;
    const minSpeed = 50;
    const maxSpeed = 400;
    const slowDownPoint = Math.floor(scrollArray.length * 0.7);

    const scroll = () => {
      setCurrentScrollingIndex((prev) => {
        const nextIndex = prev + 1;

        if (nextIndex > slowDownPoint) {
          speed = Math.min(speed + 20, maxSpeed);
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = setInterval(scroll, speed);
          }
        }

        if (nextIndex >= scrollArray.length - 1) {
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
          }
          setSelectedNft(targetNft);
          setCaseAnimationStage(2);
          return prev;
        }
        return nextIndex;
      });
    };

    scrollIntervalRef.current = setInterval(scroll, speed);

    const accelerate = setInterval(() => {
      if (speed > minSpeed) {
        speed = Math.max(speed - 10, minSpeed);
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = setInterval(scroll, speed);
        }
      } else {
        clearInterval(accelerate);
      }
    }, 150);
  };

  const closeCase = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    setCaseAnimationStage(0);
    setShowCaseOpening(false);
    setSelectedNft(null);
    setScrollingNfts([]);
  };

  const getRarityColorClass = (rarity?: string): string => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "bg-gray-600";
      case "uncommon":
        return "bg-green-600";
      case "rare":
        return "bg-blue-600";
      case "epic":
        return "bg-purple-600";
      case "legendary":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  const getRarityTextColorClass = (rarity?: string): string => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "text-gray-200";
      case "uncommon":
        return "text-green-400";
      case "rare":
        return "text-blue-400";
      case "epic":
        return "text-purple-400";
      case "legendary":
        return "text-yellow-400";
      default:
        return "text-gray-200";
    }
  };

  const fetchUserNfts = async () => {
    try {
      if (!userInfo?.username) return;

      const response = await axios.get<NFT[]>(`${backUrl}/user/nft`, {
        params: { username: userInfo.username },
      });
      setUserNfts(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке NFT пользователя:", error);
      if (error instanceof Error) {
        setDebugInfo(`Ошибка загрузки NFT пользователя: ${error.message}`);
      }
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = "/api/placeholder/64/64";
  };

  const handleLargeImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = "/api/placeholder/128/128";
  };

  const getRarityIcon = (rarity: string | undefined): string => {
    if (!rarity) return "💎";
    const normalizedRarity = rarity.toLowerCase() as keyof typeof rarityIcons;
    return rarityIcons[normalizedRarity] || "💎";
  };

  const getRarityName = (rarity: string | undefined): string => {
    if (!rarity) return "Неизвестно";
    const normalizedRarity = rarity.toLowerCase() as keyof typeof rarityMap;
    return rarityMap[normalizedRarity] || rarity;
  };

  const formatDate = (date: string | undefined): string => {
    if (!date) return "Нет данных";
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex justify-center items-center">
        <div className="text-white text-xl md:text-2xl">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col justify-center items-center p-4">
        <div className="text-white text-lg md:text-xl text-center mb-4">
          {error}
        </div>
        <button
          className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-purple-800 rounded-lg font-bold text-white shadow-lg hover:scale-105 transition-transform"
          onClick={() => window.history.back()}
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen h-full bg-gradient-to-b from-purple-900 to-indigo-900 overflow-hidden relative">
      {showCaseOpening && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
          <div className="bg-gradient-to-b from-indigo-800 to-purple-900 p-6 rounded-xl w-4/5 max-w-md text-center">
            {caseAnimationStage === 1 ? (
              <div className="py-6">
                <h3 className="text-xl text-white font-bold mb-4">
                  Открываем кейс...
                </h3>

                <div className="relative h-32 overflow-hidden mb-6">
                  <div
                    className="transition-transform duration-150 ease-linear"
                    style={{
                      transform: `translateY(-${
                        currentScrollingIndex * 100
                      }px)`,
                    }}
                  >
                    {scrollingNfts.map((nft, index) => (
                      <div
                        key={`${nft._id}-${index}`}
                        className="flex flex-col items-center justify-center h-32"
                      >
                        {nft.path ? (
                          <div className="w-16 h-16 mb-2 rounded-lg bg-indigo-700 flex-shrink-0 overflow-hidden">
                            <img
                              src={`${backUrl}${nft.path}`}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                              onError={handleLargeImageError}
                            />
                          </div>
                        ) : (
                          <div className="text-4xl mb-2">
                            {getRarityIcon(nft.rarity)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-white truncate w-full px-2">
                          {nft.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-indigo-800 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-indigo-800 to-transparent"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-16 border-t-2 border-b-2 border-yellow-400 transform -translate-y-1/2"></div>
                </div>
              </div>
            ) : caseAnimationStage === 2 && selectedNft ? (
              <div className="py-6">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl text-white font-bold mb-2">
                  Поздравляем!
                </h3>
                <div className="mb-4">
                  <p className="text-lg text-white">Вы получили:</p>
                  <div className="mt-4 flex flex-col items-center">
                    {selectedNft.path ? (
                      <div className="w-32 h-32 mb-4 rounded-lg bg-indigo-700 flex-shrink-0 overflow-hidden">
                        <img
                          src={`${backUrl}${selectedNft.path}`}
                          alt={selectedNft.name}
                          className="w-full h-full object-cover"
                          onError={handleLargeImageError}
                        />
                      </div>
                    ) : (
                      <div className="text-5xl mb-2">
                        {getRarityIcon(selectedNft.rarity)}
                      </div>
                    )}
                    <h4 className="text-xl font-bold text-white">
                      {selectedNft.name}
                    </h4>
                    <span
                      className={`inline-block mt-2 px-3 py-1 ${getRarityColorClass(
                        selectedNft.rarity
                      )} rounded-md text-sm font-bold`}
                    >
                      {getRarityName(selectedNft.rarity)}
                    </span>
                  </div>
                </div>
                <button
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-bold text-white shadow-lg hover:scale-105 transition-transform"
                  onClick={closeCase}
                >
                  Забрать
                </button>
              </div>
            ) : (
              <div className="py-8">
                <p className="text-white">
                  Произошла ошибка при открытии кейса
                </p>
                <button
                  className="mt-4 px-6 py-2 bg-red-600 rounded-lg font-bold text-white"
                  onClick={closeCase}
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </div>
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

      <div className="relative min-h-screen flex flex-col items-center py-6 md:py-12 z-10 px-4">
        <div className="mt-4 md:mt-6 mb-3 md:mb-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 drop-shadow-lg">
            МАГАЗИН
          </h1>
          {userName && (
            <p className="text-lg md:text-xl text-white mt-2">
              Привет, {userName}
            </p>
          )}
        </div>

        <div className="mb-4 flex items-center justify-center gap-6 md:gap-10">
          <div className="flex items-center gap-2">
            <div className="text-3xl md:text-4xl">💣</div>
            <span className="text-xl md:text-2xl font-bold text-white">
              {userInfo?.bombs || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-3xl md:text-4xl">🔄</div>
            <span className="text-xl md:text-2xl font-bold text-white">
              {userInfo?.mix || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-3xl md:text-4xl">📦</div>
            <span className="text-xl md:text-2xl font-bold text-white">
              {userInfo?.cases || 0}
            </span>
          </div>
        </div>

        <div className="flex w-full md:w-4/5 max-w-md mb-4 rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 md:py-3 text-center font-bold text-base md:text-lg transition-all duration-300 ${
              activeTab === "items"
                ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white"
                : "bg-gradient-to-r from-indigo-800 to-purple-900 text-gray-300 hover:text-white"
            }`}
            onClick={() => setActiveTab("items")}
          >
            Предметы
          </button>
          <button
            className={`flex-1 py-2 md:py-3 text-center font-bold text-base md:text-lg transition-all duration-300 ${
              activeTab === "nft"
                ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white"
                : "bg-gradient-to-r from-indigo-800 to-purple-900 text-gray-300 hover:text-white"
            }`}
            onClick={() => setActiveTab("nft")}
          >
            Все NFT
          </button>
          <button
            className={`flex-1 py-2 md:py-3 text-center font-bold text-base md:text-lg transition-all duration-300 allow-scroll ${
              activeTab === "my-nft"
                ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white"
                : "bg-gradient-to-r from-indigo-800 to-purple-900 text-gray-300 hover:text-white"
            }`}
            onClick={() => {
              setActiveTab("my-nft");
              fetchUserNfts();
            }}
          >
            Мои NFT
          </button>
        </div>

        <div className="flex flex-col w-full md:w-4/5 max-w-md gap-3 md:gap-4 overflow-y-auto pb-4 allow-scroll">
          {activeTab === "items" &&
            shopItems.map((item) => (
              <div
                key={item.id}
                className={`relative flex justify-between items-center py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all duration-300
                ${
                  selectedItem === item.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-105"
                    : "bg-gradient-to-r from-indigo-700 to-purple-800 text-white hover:scale-105"
                } shadow-lg`}
                style={{
                  boxShadow: `0 0 ${
                    5 + Math.sin(glowIntensity * Math.PI * 2) * 5
                  }px ${selectedItem === item.id ? "#60a5fa" : "#c4b5fd"}`,
                }}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="mr-3 md:mr-4 text-2xl md:text-3xl flex-shrink-0">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-bold truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-200 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
                <button
                  className="ml-2 md:ml-4 px-3 py-1 md:px-4 md:py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg font-bold shadow-md hover:scale-105 transition-transform text-sm md:text-base flex-shrink-0"
                  onClick={() => handleBuyItem(item)}
                >
                  {item.price} 💎
                </button>
              </div>
            ))}

          {activeTab === "nft" && (
            <>
              {nfts.length > 0 ? (
                <>
                  {nfts.map((nft) => (
                    <div
                      key={nft._id}
                      className={`relative flex justify-between items-center py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all duration-300
                        ${
                          selectedItem === nft.nftId
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-105"
                            : "bg-gradient-to-r from-indigo-700 to-purple-800 text-white hover:scale-105"
                        } shadow-lg`}
                      style={{
                        boxShadow: `0 0 ${
                          5 + Math.sin(glowIntensity * Math.PI * 2) * 5
                        }px ${
                          selectedItem === nft.nftId ? "#60a5fa" : "#c4b5fd"
                        }`,
                      }}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {nft.path ? (
                          <div className="w-12 h-12 md:w-16 md:h-16 mr-3 md:mr-4 rounded-lg bg-indigo-800 flex-shrink-0 overflow-hidden">
                            <img
                              src={`${backUrl}${nft.path}`}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                              onError={handleImageError}
                            />
                          </div>
                        ) : (
                          <span className="mr-3 md:mr-4 text-2xl md:text-3xl flex-shrink-0">
                            {getRarityIcon(nft.rarity)}
                          </span>
                        )}

                        <div className="min-w-0">
                          <h3 className="text-lg md:text-xl font-bold truncate">
                            {getRarityName(nft.rarity)}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-200 line-clamp-2">
                            NFT #{nft.nftId}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 ${getRarityColorClass(
                              nft.rarity
                            )} rounded-md text-xs font-bold`}
                          >
                            {getRarityName(nft.rarity)}
                          </span>
                        </div>
                      </div>

                      <div className="ml-2 md:ml-4">
                        <span className="block text-sm font-medium text-center mb-1">
                          Счетчик
                        </span>
                        <span className="block text-center font-bold">
                          {nft.counter}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 relative flex flex-col justify-center items-center py-4 md:py-6 px-4 md:px-6 rounded-lg transition-all duration-300 bg-gradient-to-r from-amber-600 to-yellow-700 text-white shadow-lg">
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                      Новое!
                    </div>
                    <div className="text-5xl md:text-6xl mb-2 animate-pulse">
                      📦
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-1 text-center">
                      Загадочный Кейс NFT
                    </h3>
                    <p className="text-sm md:text-base text-center mb-4">
                      Откройте кейс и получите случайное NFT разной редкости
                    </p>
                    <button
                      className="px-6 py-2 md:px-8 md:py-3 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg font-bold text-white shadow-lg hover:scale-105 transition-transform"
                      onClick={handleOpenCase}
                      disabled={!userInfo?.cases || userInfo?.cases <= 0}
                    >
                      {userInfo?.cases && userInfo.cases > 0
                        ? "Открыть Кейс"
                        : "Нет доступных кейсов"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-indigo-800 bg-opacity-50 text-white mb-4">
                    <p className="text-lg md:text-xl mb-2">
                      У вас пока нет NFT
                    </p>
                    <p className="text-sm text-center">
                      Приобретите NFT, чтобы получить бонусы в игре
                    </p>
                  </div>

                  <div className="mt-2 relative flex flex-col justify-center items-center py-4 md:py-6 px-4 md:px-6 rounded-lg transition-all duration-300 bg-gradient-to-r from-amber-600 to-yellow-700 text-white shadow-lg">
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                      Новое!
                    </div>
                    <div className="text-5xl md:text-6xl mb-2 animate-pulse">
                      📦
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-1 text-center">
                      Загадочный Кейс NFT
                    </h3>
                    <p className="text-sm md:text-base text-center mb-4">
                      Откройте кейс и получите случайное NFT разной редкости
                    </p>
                    <button
                      className="px-6 py-2 md:px-8 md:py-3 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg font-bold text-white shadow-lg hover:scale-105 transition-transform"
                      onClick={handleOpenCase}
                      disabled={!userInfo?.cases || userInfo?.cases <= 0}
                    >
                      {userInfo?.cases && userInfo.cases > 0
                        ? "Открыть Кейс"
                        : "Нет доступных кейсов"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {activeTab === "my-nft" && (
          <div
            className="w-full allow-scroll"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            {userNfts.length > 0 ? (
              userNfts.map((nft) => (
                <div
                  key={nft._id}
                  className="relative flex justify-between items-center py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all duration-300 bg-gradient-to-r from-indigo-700 to-purple-800 text-white hover:scale-105 shadow-lg mb-3"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {nft.path ? (
                      <div className="w-12 h-12 md:w-16 md:h-16 mr-3 md:mr-4 rounded-lg bg-indigo-800 flex-shrink-0 overflow-hidden">
                        <img
                          src={`${backUrl}${nft.path}`}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      </div>
                    ) : (
                      <span className="mr-3 md:mr-4 text-2xl md:text-3xl flex-shrink-0">
                        {getRarityIcon(nft.rarity)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-bold truncate">
                        {getRarityName(nft.rarity)}
                      </h3>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 ${getRarityColorClass(
                          nft.rarity
                        )} rounded-md text-xs font-bold`}
                      >
                        {getRarityName(nft.rarity)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-2 md:ml-4">
                    <span className="block text-sm font-medium text-center mb-1">
                      Получено
                    </span>
                    <span className="block text-center font-bold">
                      {formatDate(nft.obtainedAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-indigo-800 bg-opacity-50 text-white">
                <p className="text-lg md:text-xl mb-2">У вас пока нет NFT</p>
                <p className="text-sm text-center">
                  Открывайте кейсы, чтобы пополнить коллекцию
                </p>
              </div>
            )}
          </div>
        )}
        <button
          className="mt-auto mb-4 md:mb-6 px-5 py-2 md:px-6 md:py-3 bg-gradient-to-r from-indigo-700 to-purple-800 rounded-lg font-bold text-white shadow-lg hover:scale-105 transition-transform"
          onClick={() => window.history.back()}
        >
          Назад
        </button>
      </div>
    </div>
  );
};

export default Shop;
