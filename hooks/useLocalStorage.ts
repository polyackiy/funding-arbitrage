import { useState, useEffect } from 'react';

// Функция для преобразования Set в объект для сериализации
function serializeSet(set: Set<any>) {
  return {
    _type: 'Set',
    values: Array.from(set),
  };
}

// Функция для восстановления Set из объекта
function deserializeSet(obj: any) {
  if (obj?._type === 'Set') {
    return new Set(obj.values);
  }
  return obj;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Создаем состояние с функцией инициализации, чтобы читать из localStorage только один раз
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      const parsedItem = item ? JSON.parse(item) : initialValue;
      // Проверяем, является ли значение Set'ом
      return initialValue instanceof Set ? deserializeSet(parsedItem) : parsedItem;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Обновляем localStorage при изменении значения
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Сериализуем Set перед сохранением
        const valueToStore = storedValue instanceof Set ? serializeSet(storedValue) : storedValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
