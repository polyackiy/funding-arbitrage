#!/bin/bash

# Поиск процесса воркера
worker_process=$(ps aux | grep "[t]s-node.*start-worker.ts" | awk '{print $2}')

if [ -n "$worker_process" ]; then
    echo "Воркер запущен (PID: $worker_process)"
    
    # Показать время работы процесса
    ps -p $worker_process -o etime=
else
    echo "Воркер не запущен"
fi
