import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import axios from "axios";

// Объявление типов для состояний

interface BackgroundGem {
  id: string;
  x: number;
  y: number;
  type: string;
  speed: number;
  size: number;
  rotate: number;
  rotateSpeed: number;
}

interface Gem {
  type: string;
  id: string;
  row: number;
  col: number;
  matched?: boolean;
}

const BACK_URL = process.env.NEXT_PUBLIC_BACK_URL;

const createBackgroundGem = (id: number) => {
  const gemTypes = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "pink",
    "orange",
  ];
  return {
    id: `bg-gem-${id}`,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * -1 - 50,
    type: gemTypes[Math.floor(Math.random() * gemTypes.length)],
    speed: 1 + Math.random() * 3,
    size: 20 + Math.random() * 30,
    rotate: Math.random() * 360,
    rotateSpeed: (Math.random() - 0.5) * 2,
  };
};

const GamePage = () => {
  const router = useRouter();
  const [grid, setGrid] = useState<Gem[][]>([]);
  const [score, setScore] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [draggedGem, setDraggedGem] = useState<Gem | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef(null);
  const [cellSize, setCellSize] = useState(56); // Default size, will be updated based on screen size
  const [backgroundGems, setBackgroundGems] = useState<BackgroundGem[]>([]);
  const [bombSelected, setBombSelected] = useState(false);
  const [bombsLeft, setBombsLeft] = useState(100); // Начальное количество бомб
  const [isMixing, setIsMixing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mixesLeft, setMixesLeft] = useState(3); // Начальное количество миксов
  const [targetGem, setTargetGem] = useState<Gem | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const scoreRef = useRef(score);
  const [gameOver, setGameOver] = useState(false);
  // const [levelNumber, setLevelNumber] = useState(1);
  const [sendingResults, setSendingResults] = useState(false);
  const [resultSent, setResultSent] = useState(false);

  // Добавление типов для переменных
  let positions: { row: number; col: number }[] = [];

  useEffect(() => {
    setBackgroundGems(
      Array.from({ length: 15 }, (_, i) => createBackgroundGem(i))
    );
  }, []);

  useEffect(() => {
    scoreRef.current = score; // Обновляем ref при каждом изменении score
  }, [score]);

  // Типы кристаллов с ссылками на изображения
  const gemTypes = [
    { type: "red", image: "/img/avalanche.png" },
    { type: "blue", image: "/img/eth.png" },
    { type: "green", image: "/img/usdt.png" },
    { type: "yellow", image: "/img/doge.png" },
    { type: "purple", image: "/img/bnb.png" },
    { type: "pink", image: "/img/sol.png" },
    { type: "orange", image: "/img/btc.png" },
  ];

  // Используем заглушки для изображений, т.к. реальные изображения недоступны
  const gemImages: Record<string, string> = {
    red: "/img/avalanche.png",
    blue: "/img/eth.png",
    green: "/img/usdt.png",
    yellow: "/img/doge.png",
    purple: "/img/sol.png",
    pink: "/img/bnb.png",
    orange: "/img/btc.png",
  };

  // Цвета для заглушек
  const gemColors: Record<string, string> = {
    red: "#f87171",
    blue: "#60a5fa",
    green: "#4ade80",
    yellow: "#fbbf24",
    purple: "#a78bfa",
    pink: "#fb923c",
    orange: "#fb923c",
  };

  // Инициализация игры
  useEffect(() => {
    initializeGrid();
    initializeBackgroundGems();
    updateCellSize();
    window.addEventListener("resize", updateCellSize);

    return () => {
      window.removeEventListener("resize", updateCellSize);
      if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);
    };
  }, []);

  // Update cell size based on screen width
  const updateCellSize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const availableWidth = screenWidth - 32;
    const availableHeight = screenHeight - 250;
    const maxCellSize = Math.min(
      Math.floor(availableWidth / 8) - 2,
      Math.floor(availableHeight / 8) - 2
    );
    setCellSize(Math.max(32, Math.min(56, maxCellSize)));
  };

  // Инициализация фоновых падающих кристаллов
  const initializeBackgroundGems = () => {
    const isClient = typeof window !== "undefined";
    if (!isClient) return;

    // Уменьшаем количество фоновых гемов на мобильных устройствах
    const isMobile = window.innerWidth < 768;
    const gemCount = isMobile ? 5 : 10;

    const gems = Array.from({ length: gemCount }, (_, i) =>
      createBackgroundGem(i)
    );
    setBackgroundGems(gems);

    let lastTime = 0;
    const animate = (timestamp: number) => {
      // Ограничиваем частоту обновлений до ~30 FPS для экономии ресурсов
      if (timestamp - lastTime > 33) {
        // примерно 30 fps
        lastTime = timestamp;

        setBackgroundGems((prevGems) => {
          return prevGems.map((gem) => {
            const newY = gem.y + gem.speed;
            if (newY > window.innerHeight) {
              return createBackgroundGem(parseInt(gem.id.split("-")[2]));
            }
            return {
              ...gem,
              y: newY,
              rotate: gem.rotate + gem.rotateSpeed,
            };
          });
        });
      }

      bgAnimationRef.current = requestAnimationFrame(animate);
    };

    bgAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (bgAnimationRef.current) {
        cancelAnimationFrame(bgAnimationRef.current);
      }
    };
  };

  // Добавьте эту ссылку в компоненте
  const bgAnimationRef = useRef<number | null>(null);

  // Единая обработка таймера
  useEffect(() => {
    const tick = () => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Вместо перехода на меню, завершаем игру
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    };

    timerRef.current = setInterval(tick, 1000) as unknown as NodeJS.Timeout;
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current as NodeJS.Timeout);
      }
    };
  }, []);

  const initializeGrid = () => {
    const newGrid = [];
    for (let row = 0; row < 8; row++) {
      const newRow = [];
      for (let col = 0; col < 8; col++) {
        newRow.push({
          type: getRandomGemType(),
          id: `${row}-${col}`,
          row,
          col,
        });
      }
      newGrid.push(newRow);
    }
    setGrid(newGrid);
  };

  const getRandomGemType = () => {
    return gemTypes[Math.floor(Math.random() * gemTypes.length)].type;
  };

  const handleDragStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent, row: number, col: number) => {
      if (isSwapping || isMixing || gameOver) return;

      if (bombSelected) {
        useBomb(row, col);
        return;
      }

      const gem = grid[row][col];
      setDraggedGem(gem);
      setIsDragging(true);

      // Получаем начальные координаты
      let clientX, clientY;
      if ("touches" in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
        // Для мобилок сохраняем начальную точку касания
        touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      // Вычисляем смещение относительно центра гема
      if (gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const gemX = gridRect.left + col * cellSize + cellSize / 2;
        const gemY = gridRect.top + row * cellSize + cellSize / 2;
        setDragOffset({
          x: clientX - gemX,
          y: clientY - gemY,
        });
        setDragPosition({ x: clientX, y: clientY });
      }

      // Предотвращаем стандартное поведение
      event.preventDefault();
    },
    [grid, isSwapping, isMixing, bombSelected, cellSize, gameOver]
  );

  // Обработка перемещения (для ПК и мобилок)
  const handleDragMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging || !draggedGem) return;

      let clientX, clientY;
      if ("touches" in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      setDragPosition({ x: clientX, y: clientY });

      // Для мобилок определяем целевой гем при перемещении
      if ("touches" in event && gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const x = clientX - gridRect.left;
        const y = clientY - gridRect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (
          row >= 0 &&
          row < 8 &&
          col >= 0 &&
          col < 8 &&
          (row !== draggedGem.row || col !== draggedGem.col)
        ) {
          setTargetGem(grid[row][col]);
        } else {
          setTargetGem(null);
        }
      }
    },
    [isDragging, draggedGem, cellSize, grid]
  );

  // Обработка окончания перетаскивания (для ПК и мобилок)
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !draggedGem) {
      setIsDragging(false);
      return;
    }

    // Для мобилок - обработка свайпа
    if (touchStartRef.current) {
      const { x: startX, y: startY, time } = touchStartRef.current;
      const dx = dragPosition.x - startX;
      const dy = dragPosition.y - startY;
      const duration = Date.now() - time;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isSwipe = distance > cellSize / 2 || duration < 300;

      if (
        isSwipe &&
        targetGem &&
        isAdjacent(draggedGem.row, draggedGem.col, targetGem.row, targetGem.col)
      ) {
        swapGems(draggedGem, targetGem);
      }
    }
    // Для ПК - проверяем, куда отпустили гем
    else if (gridRef.current) {
      const gridRect = gridRef.current.getBoundingClientRect();
      const x = dragPosition.x - gridRect.left;
      const y = dragPosition.y - gridRect.top;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (
        row >= 0 &&
        row < 8 &&
        col >= 0 &&
        col < 8 &&
        isAdjacent(draggedGem.row, draggedGem.col, row, col)
      ) {
        swapGems(draggedGem, grid[row][col]);
      }
    }

    // Сброс состояния
    setDraggedGem(null);
    setTargetGem(null);
    touchStartRef.current = null;
    setIsDragging(false);
  }, [isDragging, draggedGem, dragPosition, targetGem, cellSize, grid]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Helper function to check if gems are adjacent
  const isAdjacent = (
    row1: number,
    col1: number,
    row2: number,
    col2: number
  ) => {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const handleMatches = (matchedPositions: string[]) => {
    if (isProcessing || matchedPositions.length === 0) return;
    setIsProcessing(true);

    // Create a new grid to modify
    const newGrid = [...grid];

    // Mark matched gems and create explosions
    matchedPositions.forEach((posStr) => {
      const [row, col] = posStr.split("-").map(Number);
      const gemType = newGrid[row][col].type;

      // Mark gem as matched
      newGrid[row][col].matched = true;
    });

    // Update the grid
    setGrid(newGrid);

    // Update score (100 points per matched gem)
    setScore((prevScore) => prevScore + matchedPositions.length * 100);

    // After a short delay for animations, replace matched gems
    setTimeout(() => {
      replaceMatchedGems();
    }, 300);
  };

  // Обновление функций с типами
  const swapGems = (gem1: Gem, gem2: Gem) => {
    if (!isAdjacent(gem1.row, gem1.col, gem2.row, gem2.col)) return;

    setIsSwapping(true);
    const newGrid = [...grid];
    const tempType = newGrid[gem1.row][gem1.col].type;

    newGrid[gem1.row][gem1.col].type = newGrid[gem2.row][gem2.col].type;
    newGrid[gem2.row][gem2.col].type = tempType;

    setGrid(newGrid);
    setTimeout(() => {
      setIsSwapping(false);
      checkMatches();
    }, 300);
  };

  // Функция применения бомбы
  const useBomb = (row: number, col: number) => {
    if (bombsLeft <= 0) return;

    // Уменьшаем количество бомб
    setBombsLeft(bombsLeft - 1);

    // Отключаем выбор бомбы
    setBombSelected(false);

    // Определяем соседние кристаллы (включая центральный)
    const neighbors: Gem[] = [];
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 0],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    // Собираем все соседние гемы, которые будут взорваны
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        neighbors.push({
          id: `${newRow}-${newCol}`,
          row: newRow,
          col: newCol,
          type: grid[newRow][newCol].type,
        });
      }
    }

    // Маркируем взорванные гемы как совпадения для их последующей замены
    const newGrid = [...grid];
    neighbors.forEach((gem) => {
      newGrid[gem.row][gem.col].matched = true;
    });

    // Добавляем очки за взрыв
    setScore((prev) => prev + 900);

    setGrid(newGrid);

    // Запускаем замену взорванных гемов после задержки для анимации
    setTimeout(() => {
      replaceMatchedGems();
    }, 300);
  };

  // Функция перемешивания массива
  const shuffle = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Функция перемешивания сетки
  const mixGrid = () => {
    if (mixesLeft <= 0 || isMixing) return;

    setIsMixing(true);
    setMixesLeft(mixesLeft - 1);
    const newGrid = [...grid];

    // Одномоментное обновление
    const shuffled = shuffle([...newGrid.flat().map((g) => g.type)]);
    newGrid.forEach((row, i) => {
      row.forEach((gem, j) => {
        gem.type = shuffled[i * 8 + j];
      });
    });

    setGrid(newGrid);
    setTimeout(() => setIsMixing(false), 800);
  };

  const checkMatches = useCallback(() => {
    // Создаем копию только если нашли совпадения
    if (isProcessing) return false;

    // Создаем копию только если нашли совпадения
    let matches = new Set<string>();
    let foundMatches = false;

    // Проверка по строкам
    for (let row = 0; row < 8; row++) {
      let currentType: string | null = null;
      let count = 0;
      positions = [];

      for (let col = 0; col < 8; col++) {
        const gemType = grid[row][col].type;

        if (gemType === currentType) {
          count++;
          positions.push({ row, col });
        } else {
          if (count >= 3) {
            foundMatches = true;
            positions.forEach((pos) => matches.add(`${pos.row}-${pos.col}`));
          }
          currentType = gemType;
          count = 1;
          positions = [{ row, col }];
        }
      }

      if (count >= 3) {
        foundMatches = true;
        positions.forEach((pos) => matches.add(`${pos.row}-${pos.col}`));
      }
    }

    // Проверка по столбцам
    for (let col = 0; col < 8; col++) {
      let currentType: string | null = null;
      let count = 0;
      positions = [];

      for (let row = 0; row < 8; row++) {
        const gemType = grid[row][col].type;

        if (gemType === currentType) {
          count++;
          positions.push({ row, col });
        } else {
          if (count >= 3) {
            foundMatches = true;
            positions.forEach((pos) => matches.add(`${pos.row}-${pos.col}`));
          }
          currentType = gemType;
          count = 1;
          positions = [{ row, col }];
        }
      }

      if (count >= 3) {
        foundMatches = true;
        positions.forEach((pos) => matches.add(`${pos.row}-${pos.col}`));
      }
    }

    if (foundMatches) {
      handleMatches([...matches]);
      return true;
    }
    setIsProcessing(false);
    return false;
  }, [grid, handleMatches, isProcessing]);

  // Check for matches after a swap
  useEffect(() => {
    if (grid.length > 0 && !isMixing && !isProcessing) {
      const timer = setTimeout(() => {
        checkMatches();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [grid, isMixing, isProcessing, checkMatches]);

  const replaceMatchedGems = () => {
    const newGrid = [...grid];

    // Replace matched gems with new ones
    for (let col = 0; col < 8; col++) {
      for (let row = 7; row >= 0; row--) {
        if (newGrid[row][col].matched) {
          // Find the first non-matched gem above
          let sourceRow = row - 1;
          while (sourceRow >= 0) {
            if (!newGrid[sourceRow][col].matched) {
              // Swap types
              newGrid[row][col].type = newGrid[sourceRow][col].type;
              newGrid[sourceRow][col].matched = true;
              break;
            }
            sourceRow--;
          }

          // If no non-matched gems found above, create a new one
          if (sourceRow < 0) {
            newGrid[row][col].type = getRandomGemType();
          }

          // Clear the matched flag
          newGrid[row][col].matched = false;
        }
      }
    }

    setGrid([...newGrid]);

    // Устанавливаем флаг обработки в false после небольшой задержки
    setTimeout(() => {
      setIsProcessing(false);
    }, 300);
  };

  const handleGameOver = () => {
    if (gameOver) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(true);
    sendLevelResults();
  };

  // Функция отправки результатов на сервер
  const sendLevelResults = async () => {
    const { level } = router.query;
    const levelToSend = Number(level);
    const currentScore = scoreRef.current;

    try {
      setSendingResults(true);
      const tg = window.Telegram?.WebApp;
      const userData = tg?.initDataUnsafe?.user;
      const username = userData.username;

      console.log("Sending score:", currentScore);

      const response = await axios.post(
        `${BACK_URL}/updateLevelProgress`,
        {
          username,
          levelNumber: levelToSend,
          score: currentScore,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Sending data:", username, levelToSend, currentScore);

      if (response.status === 200) {
        setResultSent(true);
        setTimeout(() => router.push("/menu"), 500);
      } else {
        console.error("Server responded with:", response.status, response.data);
        alert(
          `Failed to save results: ${response.data.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Failed to send level results:", error);
      if (axios.isAxiosError(error)) {
        console.error("Error details:", error.response?.data);
      }
      alert("Network error. Your results might not be saved.");
    } finally {
      setSendingResults(false);
    }
  };

  const resetGame = () => {
    setScore(0);
    setTimeLeft(60);
    setBombsLeft(100);
    setMixesLeft(3);
    setBombSelected(false);
    setIsMixing(false);
    setIsProcessing(false);
    setGameOver(false);
    setResultSent(false);

    initializeGrid();

    // Перезапуск таймера
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as NodeJS.Timeout;
  };

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    // Функция для предотвращения прокрутки
    const preventDefault = (e) => {
      e.preventDefault();
    };

    // Блокировка прокрутки при монтировании компонента
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.touchAction = "none";

    // Добавление обработчиков событий для предотвращения прокрутки
    document.addEventListener("touchmove", preventDefault, { passive: false });
    document.addEventListener("wheel", preventDefault, { passive: false });

    // Очистка при размонтировании
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

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 bg-gray-900 min-h-screen relative overflow-hidden game-container">
      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden; /* Это предотвратит горизонтальный скролл */
        }

        .game-container {
          -webkit-user-select: none;
          user-select: none;
          width: 100%;
          max-width: 100%;
          overflow: hidden; /* Скрываем всё, что выходит за границы */
        }

        .gem-container {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        .draggable {
          -webkit-user-drag: none;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
      {/* Фоновые кристаллы */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {backgroundGems.map((gem) => (
          <div
            key={gem.id}
            className="absolute"
            style={{
              left: gem.x + "px",
              top: gem.y + "px",
              width: gem.size + "px",
              height: gem.size + "px",
              transform: `rotate(${gem.rotate}deg)`,
              transition: "transform 0.1s linear",
              opacity: 0.2,
            }}
          >
            <img
              src={gemImages[gem.type]}
              alt="Gem"
              className="w-full h-full object-contain"
              style={{
                filter: `drop-shadow(0 0 5px ${gemColors[gem.type]})`,
                backgroundColor: gemColors[gem.type],
                borderRadius: "8px",
              }}
            />
          </div>
        ))}
      </div>
      {sendingResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            {resultSent ? (
              <p>Results saved! Redirecting...</p>
            ) : (
              <p>Saving your results...</p>
            )}
          </div>
        </div>
      )}
      {/* Заголовок и статистика */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-white z-10">
        Bejeweled Game
      </h1>
      <div className="flex justify-between w-full max-w-md mb-2 sm:mb-4 px-2 z-10">
        <div className="text-base sm:text-xl text-white">Score: {score}</div>
        <div className="text-base sm:text-xl font-bold text-red-400">
          Time: {formatTime(timeLeft)}
        </div>
      </div>
      {/* Панель с инструментами (бомба и микс) */}
      <div className="flex justify-center gap-3 sm:gap-4 mb-2 sm:mb-4 z-10">
        <button
          className={`relative p-1 sm:p-2 rounded-lg flex flex-col items-center ${
            bombSelected
              ? "bg-red-600 ring-2 ring-yellow-400"
              : "bg-gray-700 hover:bg-gray-600"
          } ${
            bombsLeft <= 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          onClick={() =>
            bombsLeft > 0 && !isMixing && setBombSelected(!bombSelected)
          }
          disabled={bombsLeft <= 0 || isMixing}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 flex items-center justify-center mb-1">
            <span className="text-base sm:text-xl">💣</span>
          </div>
          <span className="text-white text-xs">Bomb: {bombsLeft}</span>
          {bombSelected && (
            <div className="absolute -bottom-5 sm:-bottom-6 text-yellow-300 text-xs whitespace-nowrap">
              Select a gem
            </div>
          )}
        </button>

        <button
          className={`p-1 sm:p-2 rounded-lg flex flex-col items-center ${
            isMixing ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          } ${
            mixesLeft <= 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          onClick={() => mixesLeft > 0 && !isMixing && !isSwapping && mixGrid()}
          disabled={mixesLeft <= 0 || isMixing || isSwapping}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center mb-1">
            <span className="text-base sm:text-xl">🔄</span>
          </div>
          <span className="text-white text-xs">Mix: {mixesLeft}</span>
        </button>
      </div>
      <div
        className="bg-gray-800 p-1 sm:p-2 rounded-lg shadow-xl relative overflow-hidden z-10"
        ref={gridRef}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((gem, colIndex) => (
              <div
                key={gem.id}
                className={`m-px sm:m-1 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center draggable
                  ${
                    isDragging && draggedGem?.id === gem.id
                      ? "opacity-0"
                      : "opacity-100"
                  }
                  ${gem.matched ? "animate-pop-out" : ""}
                  ${bombSelected ? "hover:ring-2 hover:ring-red-500" : ""}
                  ${targetGem?.id === gem.id ? "ring-2 ring-yellow-400" : ""}`}
                onMouseDown={(e) => handleDragStart(e, rowIndex, colIndex)}
                onTouchStart={(e) => handleDragStart(e, rowIndex, colIndex)}
                data-gem-id={`${rowIndex}-${colIndex}`}
                style={{
                  width: cellSize + "px",
                  height: cellSize + "px",
                  transform: gem.matched ? "scale(0.8)" : "scale(1)",
                  transition: "transform 0.2s ease-out",
                }}
              >
                <img
                  src={gemImages[gem.type]}
                  alt="Gem"
                  className="object-contain"
                  style={{
                    width: cellSize - 8 + "px",
                    height: cellSize - 8 + "px",
                    filter: `drop-shadow(0 0 3px ${gemColors[gem.type]})`,
                    backgroundColor: gemColors[gem.type],
                    borderRadius: "8px",
                  }}
                />
              </div>
            ))}
          </div>
        ))}

        {/* Перетаскиваемый гем */}
        {isDragging && draggedGem && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: dragPosition.x - dragOffset.x + "px",
              top: dragPosition.y - dragOffset.y + "px",
              width: cellSize + "px",
              height: cellSize + "px",
              transform: "scale(1.2)",
            }}
          >
            <img
              src={gemImages[grid[draggedGem.row][draggedGem.col].type]}
              alt="Dragged Gem"
              className="w-full h-full object-contain"
              style={{
                filter: `drop-shadow(0 0 8px ${
                  gemColors[grid[draggedGem.row][draggedGem.col].type]
                })`,
                backgroundColor:
                  gemColors[grid[draggedGem.row][draggedGem.col].type],
                borderRadius: "8px",
              }}
            />
          </div>
        )}
      </div>
      <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-300 z-10 text-center">
        {window.innerWidth < 640
          ? "Tap and swipe gems to match"
          : "Drag a gem to an adjacent position to swap"}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(GamePage), {
  ssr: false,
});
