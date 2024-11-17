# Project overview
Твоя цель - создать приложение на next.js для автоматизации рутинных задач по арбитражу фандингов между различными биржами.
Ты будешь использовать следующие инструменты: NextJS 14, shadcn/ui, tailwindcss, Lucide icons.

# Core funcionalities
## 1. Сбор и агрегация данных с различных бирж по API
- Данные собираются с трех бирж: Hyperliquid, Binance, Bybit
- Данные собираются по API, используя документацию и примеры из этой инструкции: ## 1. Hyperliquid API Documentation, ## 2 Binance API Documentation, ## 3 Bybit API Documentation
- Данные собираются в реальном времени. На всех трех биржах в один момент времени
- Данные собираются раз в 10 секунд
- Данные выводятся в виде таблицы на странице под названием Funding Comparison
  - Таблица состоит из четырех колонок: "Coin", "Hyperliquid Funding Rate", "Binance Funding Rate", "Bybit Funding Rate"
  - Каждая колонка может быть отсортирована по возрастанию или убыванию
  - Каждая колонка может быть фильтрована по значению Funding Rate
  - Должен быть функционал для добавления и удаления коинов из таблицы
- Данные в таблице обновляются только при успешном выполнении запроса к API со всех трех бирж
- Пользователь должен выбрать в одной строке две биржи, тогда появляется кнопка "Order Placement" ниже этой строки. При нажатии на которую пользователь переходит на страницу с размещением ордера "Order Placement" на покупку/продажу соответствующего коина на соответствующей бирже

## 2. Здесь пока нефункциональная заглушка страницы с размещение ордеров на покупку/продажу на биржах
- Страница называется "Order Placement"
- На этой странице пользователь может разместить ордеры одновременно на двух биржах
- На одной из бирж будут размещены ордера Long, а на другой Short
- Алгоритм сам определит, на какой бирже разместить Long, а на какой Short
  - В шапке страницы выводятся название коина и биржа
  - Пользователь должен проверить: "Short/Long", 
  - Пользователь должен ввести "Size" (Размер ордера за одну итерацию Long/Short), "Quantity" (количество итераций размещиния Long/Short)
  - Ниже кнопка "Place Order", при нажатии на которую происходит отправка запроса к API соответствующей бирже

## 3. Здесь пока нефункциональная заглушка страницы Страница с информацией об открытых позициях на биржах
- Страница называется "Open Positions"
- На этой странице пользователь может увидеть информацию об открытых позициях на биржах
- Данные выводятся в виде таблицы
  | Coin Ticker | Size | Size usd | Time open | Base point open | Commission total | Funding1 | funding2 | Time1 | Time2 | APR | Button Calculate |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Валютная пара, по которой набрана позиция, например BTC/USDT | Размер позиции в токенах, например 1.43 BTC | Размер позиции в USDT, например 128000 USDT | Время в которое начали набирать позицию. Т.е. Время в которое размещен первый ордер | Разница между фактическими (по которым исполнились ордера) ценами между биржами, выраженная в количестве бп - базовых пунктов (1 бп - 0,01%) | На момент, когда ордера еще открыты - Общая сумма комиссий за открытие ордеров на обеих биржах. При закрытии ордеров сюда плюсуется еще комиссия за закрытие. | Фандинг на первой бирже | Фандинг на второй бирже | Время в которое биржей взимается (или выплачивается) первый фандинг. На разных биржах это по-разному. Hyperliquid взимает раз в 1 час. Например позиция открыта в 14-32, фандинг берется в 15-00. На Binance и Bybit фандинг взимается раз в 8 часов. В 00-00, 08-00, 16-00 UTC | Время для расчета APR. Указывается пользователем в ячейке. По умолчанию в ячейке текущее время. В формате DD.MM.YYYY HH:MI Указывать можно время больше, чем Time1 и меньше либо равно текущему, иначе выводится предупреждение об ошибке | Годовая доходность выраженная в процентах. Высчитывается из разницы в фандингах между биржами. С момента времени в ячейке Time1 до времени в ячейке Time2 | Здесь кнопка CALCULATE. По которой актуализируются данные в ячейках |

# Doc
## 1. Hyperliquid API Documentation
- [API Reference](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api)
- Retrieve perpetuals asset contexts (includes mark price, current funding, open interest, etc)
POST
 https://api.hyperliquid.xyz/info

### Headers

| Name | Type | Description |
| --- | --- | --- |
| Content-Type | *String | "application/json" |

### Request Body

| Name | Type | Description |
| --- | --- | --- |
| type | *String | "metaAndAssetCtxs" |

### 200: OK Successful Response
    [
    {
        "universe": [
            {
                "name": "BTC",
                "szDecimals": 5,
                "maxLeverage": 50,
                "onlyIsolated": false
            },
            {
                "name": "ETH",
                "szDecimals": 4,
                "maxLeverage": 50,
                "onlyIsolated": false
            },
            {
                "name": "HPOS",
                "szDecimals": 0,
                "maxLeverage": 3,
                "onlyIsolated": true
            }
        ]
    },
    [
        {
            "dayNtlVlm": "1169046.29406",
            "funding": "0.0000125",
            "impactPxs": [
                "14.3047",
                "14.3444"
            ],
            "markPx": "14.3161",
            "midPx": "14.314",
            "openInterest": "688.11",
            "oraclePx": "14.32",
            "premium": "0.00031774",
            "prevDayPx": "15.322"
        },
        {
            "dayNtlVlm": "1426126.295175",
            "funding": "0.0000125",
            "impactPxs": [
                "6.0386",
                "6.0562"
            ],
            "markPx": "6.0436",
            "midPx": "6.0431",
            "openInterest": "1882.55",
            "oraclePx": "6.0457",
            "premium": "0.00028119",
            "prevDayPx": "6.3611"
        },
        {
            "dayNtlVlm": "809774.565507",
            "funding": "0.0000125",
            "impactPxs": [
                "8.4505",
                "8.4722"
            ],
            "markPx": "8.4542",
            "midPx": "8.4557",
            "openInterest": "2912.05",
            "oraclePx": "8.4585",
            "premium": "0.00033694",
            "prevDayPx": "8.8097"
        }
    ]
    ]

## 2. Binance API Documentation
- [API Reference](https://developers.binance.com/docs/derivatives/usds-margined-futures/general-info)

- Get Funding Rate Info
    - API Description
        - Query funding rate info for symbols that had FundingRateCap/ FundingRateFloor / fundingIntervalHours adjustment

    - HTTP Request
        - GET /fapi/v1/fundingInfo

    - Request Weight
         - 0 share 500/5min/IP rate limit with GET /fapi/v1/fundingInfo

    - Request Parameters
        

    - Response Example
    ```
    [
        {
            "symbol": "BLZUSDT",
            "adjustedFundingRateCap": "0.02500000",
            "adjustedFundingRateFloor": "-0.02500000",
            "fundingIntervalHours": 8,
            "disclaimer": false   // ingore
        }
    ]
    ```
       
## 3. Bybit API Documentation
- [API Reference](https://bybit-exchange.github.io/docs/v5/)

- Get Funding Rate History
    - Query for historical funding rates. Each symbol has a different funding interval. For example, if the interval is 8 hours and the current time is UTC 12, then it returns the last funding rate, which settled at UTC 8.
    
    - To query the funding rate interval, please refer to the instruments-info endpoint.

    Covers: USDT and USDC perpetual / Inverse perpetual

    info
    Passing only startTime returns an error.
    Passing only endTime returns 200 records up till endTime.
    Passing neither returns 200 records up till the current time.

    - HTTP Request
        - GET /v5/market/funding/history

    - Request Parameters
        Parameter | Required | Type | Comments
         --- | --- | --- | ---
         category | true | string | Product type. linear, inverse
         symbol | true | string | Symbol name, like BTCUSDT, uppercase only
         startTime | false | integer | The start timestamp (ms)
         endTime | false | integer | The end timestamp (ms)
         limit | false | integer | Limit for data size per page. [1, 200]. Default: 200

    - Response Parameters
         Parameter | Type | Comments
         --- | --- | ---
         category | string | Product type
         list | array | Object
         \>symbol | string | Symbol name
         \>fundingRate | string | Funding rate
         \>fundingRateTimestamp | string | \>Funding rate timestamp (ms)

    - Response Example
    ```
        {
            "retCode": 0,
            "retMsg": "OK",
            "result": {
                "category": "linear",
                "list": [
                    {
                        "symbol": "ETHPERP",
                        "fundingRate": "0.0001",
                        "fundingRateTimestamp": "1672041600000"
                    }
                ]
            },
            "retExtInfo": {},
            "time": 1672051897447
        }
    ```
