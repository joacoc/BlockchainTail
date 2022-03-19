# Blockchain Tail

https://user-images.githubusercontent.com/11491779/159137765-18d74cbf-bd52-49c1-8fa5-08b9758d71b6.mov

## 💡 Concept
Query in different ways blockchain logs from Kafka without using views, materialized views or tables. 

Connect to [Alchemy](https://www.alchemy.com) (a web3 service provider) and listen to Ethereum blockchain logs. Send those events to a Kafka topic and then use Tails to stream the information in the way the user wants using SQL.

If two equal queries are running from different clients, the node service will reuse the first running tail to avoid multiple tails querying doing the same. It is done by hashing the query and using the same "room" to share the results with their users.

The exciting part of this concept is using Materialize with just a source and tails to avoid handling views or materialized views inside Materialize and not requesting the Snapshot to reprocess everything in the source. It is impossible with a view since it will request everything from the source. A tail without Snapshot can start immediately.

It is a use case where Materialize acts more as a processing framework than as a database.

Another point that stands out is: Materialize resource consumption (just 100MB). Ten times less than other processing frameworks like Flink or Spark? (This facts needs to be checked more deeply)

| ⚠️ WARNING: Remember to add your ALCHEMY_KEY to `docker_compose.yml`! |
| --- |

## Diagram
![Diagram](https://user-images.githubusercontent.com/11491779/159138124-a630fcad-5ce2-489a-904e-27a8b55e87b4.png)
