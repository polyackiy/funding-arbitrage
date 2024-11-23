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

- Данные в таблице должны сохраняться в базе данных и обновляться регулярно. Чтобы в любой момент пользователь мог увидеть актуальную информацию об открытых позициях и уже завершенных сделках 

# Doc
## 1. Hyperliquid API Documentation
- [API Reference](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api)
### Retrieve perpetuals asset contexts (includes mark price, current funding, open interest, etc)
POST
 https://api.hyperliquid.xyz/info

#### Headers

| Name | Type | Description |
| --- | --- | --- |
| Content-Type | *String | "application/json" |

#### Request Body

| Name | Type | Description |
| --- | --- | --- |
| type | *String | "metaAndAssetCtxs" |

#### 200: OK Successful Response
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

### Mark Price
#### API Description
Mark Price and Funding Rate

#### HTTP Request
GET /fapi/v1/premiumIndex

#### Request Weight
1

#### Request Parameters
| Name | Type | Mandatory | Description |
| --- | --- | --- | --- |
| symbol | STRING | NO | |

#### Response Example
Response:

```
{
	"symbol": "BTCUSDT",
	"markPrice": "11793.63104562",	// mark price
	"indexPrice": "11781.80495970",	// index price
	"estimatedSettlePrice": "11781.16138815", // Estimated Settle Price, only useful in the last hour before the settlement starts.
	"lastFundingRate": "0.00038246",  // This is the Latest funding rate
	"nextFundingTime": 1597392000000,
	"interestRate": "0.00010000",
	"time": 1597370495002
}
```

OR (when symbol not sent)

```
[
	{
	    "symbol": "BTCUSDT",
	    "markPrice": "11793.63104562",	// mark price
	    "indexPrice": "11781.80495970",	// index price
	    "estimatedSettlePrice": "11781.16138815", // Estimated Settle Price, only useful in the last hour before the settlement starts.
	    "lastFundingRate": "0.00038246",  // This is the Latest funding rate
	    "nextFundingTime": 1597392000000,
	    "interestRate": "0.00010000",	
	    "time": 1597370495002
	}
]
```


       
## 3. Bybit API Documentation
- [API Reference](https://bybit-exchange.github.io/docs/v5/)

### Get Tickers
Query for the latest price snapshot, best bid/ask price, and trading volume in the last 24 hours.

Covers: Spot / USDT perpetual / USDC contract / Inverse contract / Option

info
If category=option, symbol or baseCoin must be passed.

#### HTTP Request
GET /v5/market/tickers

#### Request Parameters
| Parameter | Required | Type | Comments |
| --- | --- | --- | --- |
| category | true | string | Product type. spot,linear,inverse,option |
| symbol | false | string | Symbol name, like BTCUSDT, uppercase only |
| baseCoin | false | string | Base coin, uppercase only. Apply to option only |
| expDate | false | string | Expiry date. e.g., 25DEC22. Apply to option only |

#### Response Parameters

| Parameter | Type | Comments |
| --- | --- | --- |
| category | string | Product type |
| list | array | Object |
| > symbol | string | Symbol name |
| > lastPrice | string | Last price |
| > indexPrice | string | Index price |
| > markPrice | string | Mark price |
| > prevPrice24h | string | Market price 24 hours ago |
| > price24hPcnt | string | Percentage change of market price relative to 24h |
| > highPrice24h | string | The highest price in the last 24 hours |
| > lowPrice24h | string | The lowest price in the last 24 hours |
| > prevPrice1h | string | Market price an hour ago |
| > openInterest | string | Open interest size |
| > openInterestValue | string | Open interest value |
| > turnover24h | string | Turnover for 24h |
| > volume24h | string | Volume for 24h |
| > fundingRate | string | Funding rate |
| > nextFundingTime | string | Next funding time (ms) |
| > predictedDeliveryPrice | string | Predicated delivery price. It has value when 30 min before delivery |
| > basisRate | string | Basis rate |
| > basis | string | Basis |
| > deliveryFeeRate | string | Delivery fee rate |
| > deliveryTime | string | Delivery timestamp (ms) |
| > ask1Size | string | Best ask size |
| > bid1Price | string | Best bid price |
| > ask1Price | string | Best ask price |
| > bid1Size | string | Best bid size |
| > preOpenPrice | string | Estimated pre-market contract open price<br>The value is meaningless when entering continuous trading phase |
| > preQty | string | Estimated pre-market contract open qty<br>The value is meaningless when entering continuous trading phase |
| > curPreListingPhase | string | The current pre-market contract phase |

#### Request Example

```
GET /v5/market/tickers?category=inverse&symbol=BTCUSD HTTP/1.1
Host: api-testnet.bybit.com
```

#### Response Example
```
{
    "retCode": 0,
    "retMsg": "OK",
    "result": {
        "category": "inverse",
        "list": [
            {
                "symbol": "BTCUSD",
                "lastPrice": "16597.00",
                "indexPrice": "16598.54",
                "markPrice": "16596.00",
                "prevPrice24h": "16464.50",
                "price24hPcnt": "0.008047",
                "highPrice24h": "30912.50",
                "lowPrice24h": "15700.00",
                "prevPrice1h": "16595.50",
                "openInterest": "373504107",
                "openInterestValue": "22505.67",
                "turnover24h": "2352.94950046",
                "volume24h": "49337318",
                "fundingRate": "-0.001034",
                "nextFundingTime": "1672387200000",
                "predictedDeliveryPrice": "",
                "basisRate": "",
                "deliveryFeeRate": "",
                "deliveryTime": "0",
                "ask1Size": "1",
                "bid1Price": "16596.00",
                "ask1Price": "16597.50",
                "bid1Size": "1",
                "basis": ""
            }
        ]
    },
    "retExtInfo": {},
    "time": 1672376496682
}
```