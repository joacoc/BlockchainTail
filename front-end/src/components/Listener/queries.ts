const Queries: { [id: string]: string } = {
    Ethereum: `-- Read parsed data
  SELECT
      parsed_data->'address' as Address,
      parsed_data->'topics' as Topics,
      -- CAST( parsed_data->'data' AS TEXT) as data,
      parsed_data->'blockNumber' as BlockNumber,
      parsed_data->'transactionHash' as TransactionHash,
      parsed_data->'transactionIndex' as TransactionIndex,
      parsed_data->'blockHash' as BlockHash,
      parsed_data->'logIndex' as LogIndex,
      parsed_data->'removed' as Removed,
      parsed_data->'id' as ID
  FROM (
      -- Parse data from Kafka
      SELECT
          CAST (data AS jsonb) AS parsed_data 
      FROM (
          SELECT convert_from(data, 'utf8') AS data
          FROM ethereum_logs
      )
  );
`,
};

export default Queries;
