CREATE SOURCE ethereum_logs
FROM KAFKA BROKER 'broker:29092' TOPIC 'ethereum_logs'
WITH (kafka_time_offset = -1)
FORMAT BYTES;

-- Tail logs without a Materialized View ;) - :
-- COPY (TAIL (
--     SELECT convert_from(data, 'utf8') AS data
--     FROM ethereum_logs
-- ) WITH (SNAPSHOT = false)) TO STDOUT;

-- Tail logs parsed in utf
-- COPY (
--     TAIL (
--             -- Parse data from Kafka
--         SELECT
--             CAST (data AS jsonb) AS parsed_data 
--         FROM (
--             SELECT convert_from(data, 'utf8') AS data
--             FROM ethereum_logs
--         )
--     ) WITH (SNAPSHOT = false)
-- ) TO STDOUT;

-- COPY (
--     TAIL (
--         SELECT
--             CAST (data AS jsonb) AS parsed_data 
--         FROM (
--             SELECT convert_from(data, 'utf8') AS data
--             FROM ethereum_logs
--         ) WHERE CAST(CAST (data AS jsonb)->'blockNumber' AS INT) > 14387102

--     ) WITH (SNAPSHOT = false)
-- ) TO STDOUT;

-- Read json structure
-- COPY (
--     TAIL (
--         -- Read parsed data
--         SELECT
--             parsed_data->'address',
--             parsed_data->'topics',
--             CAST( parsed_data->'data' AS TEXT),
--             parsed_data->'blockNumber',
--             parsed_data->'transactionHash',
--             parsed_data->'transactionIndex',
--             parsed_data->'blockHash',
--             parsed_data->'logIndex',
--             parsed_data->'removed',
--             parsed_data->'id'
--         FROM (
--             -- Parse data from Kafka
--             SELECT
--                 CAST (data AS jsonb) AS parsed_data 
--             FROM (
--                 SELECT convert_from(data, 'utf8') AS data
--                 FROM ethereum_logs
--             )
--         )
--     )
-- ) TO STDOUT;

-- Ethereum log structure:
-- {
--    "address":"0x28e4F3a7f651294B9564800b2D01f35189A5bFbE",
--    "topics":[
--       "0x103fed9db65eac19c4d870f49ab7520fe03b99f1838e5996caf47e9e43308392",
--       "0x00000000000000000000000000000000000000000000000000000000001be6ba",
--       "0x000000000000000000000000a6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa"
--    ],
--    "data":"0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000010087a7811f4bfedea3d341ad165680ae306b01aaeacc205d227629cf157dd9f821000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000009fe59ab5ac6c00a80f5c05acd3071a22b61f25bf00000000000000000000000094e496474f1725f1c1824cb5bdb92d7691a4f03a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000004563918244f40000",
--    "blockNumber":14386983,
--    "transactionHash":"0xc1b4e394a554b53f651755f4826a9f9dc981fa28bbc28c29acf337d6065af9a1",
--    "transactionIndex":215,
--    "blockHash":"0x1660e1533f0907d7819c9f641a7f9896df47e29fe5f270b3d332e4521a39fbab",
--    "logIndex":500,
--    "removed":false,
--    "id":"log_27222536"
-- }