import {
    Box,
    Button,
    Flex,
    Grid,
    GridItem,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./codemirror.css";
import { Controlled as CodeMirror } from "react-codemirror2";
import Table from "../Table";
import Queries from "./queries";
import crypto from "crypto-js";
import Base64 from "crypto-js/enc-base64";

export default function Listener(): JSX.Element {
    const [socket, setSocket] = useState<Socket | undefined>(undefined);
    const [query, setQuery] = useState<string>(Queries["Ethereum"]);
    const [logs, setLogs] = useState<Array<any>>([]);
    const [columns, setColumns] = useState<Array<any>>([]);
    const [loading, setLoading] = useState<boolean>();
    const [error, setError] = useState<string | undefined>(undefined);

    /**
     * Setup Socket
     */
    useEffect(() => {
        if (socket) {
            const logsListener = (socketLogs: any) => {
                if (typeof socketLogs === "string") {
                    setError(socketLogs);
                    setLoading(false);
                } else if (socketLogs.length > 0) {
                    const [log] = socketLogs;
                    const logColumns = Object.keys(log);

                    if (columns.length === 0 && logColumns.length > 0) {
                        const newColumns = logColumns
                            .filter(
                                (column) => column !== "mz_timestamp" && column !== "mz_diff"
                            )
                            .map((column) => ({
                                Header: column,
                                accessor: column,
                            }));

                        setColumns(newColumns);
                        setLoading(false);
                    }

                    setLogs([...socketLogs, ...logs]);
                }
            };

            const hashDigest = crypto.SHA256(query);
            const hash = Base64.stringify(hashDigest);
            socket.on(hash, logsListener);

            return () => {
                socket.off(hash, logsListener);
            };
        }
    }, [columns, query, logs, socket]);

    /**
     * Tail query updater
     */
    const updateTail = useCallback(
        (query) => {
            if (query) {
                if (socket) {
                    socket.disconnect();
                }

                const newSocket = io("http://localhost:4000", {
                    query: {
                        query,
                    },
                });
                setSocket(newSocket);
            }
        },
        [socket]
    );

    const onClick = useCallback(() => {
        console.log("Running query: ", query);
        updateTail(query);
        setLogs([]);
        setColumns([]);
        setLoading(true);
        setError(undefined);
    }, [query, updateTail]);

    const onFilterClick = useCallback((filter: string) => {
        setQuery(Queries[filter]);
    }, []);

    return (
        <VStack height={"100%"} width={"100%"} overflow="hidden">
            <Grid
                width={"100%"}
                templateColumns="repeat(2, 1fr)"
                gap={6}
                overflow={"hidden"}
                paddingBottom={2}
            >
                <GridItem>
                    <Button
                        onClick={() => onFilterClick("Ethereum")}
                        backgroundColor={"transparent"}
                        marginRight={"100%"}
                    >
                        {" Reset "}
                    </Button>
                </GridItem>
                {error && (
                    <Box margin={"auto"} textAlign="center" textColor={"red.400"}>
                        <Text fontSize={"sm"} fontWeight={400}>
                            Oops. Error running query. <br /> {error}
                        </Text>
                    </Box>
                )}
                {loading ? (
                    <Flex flexFlow={"row"} alignItems="center" margin={"auto"}>
                        <Text fontSize={"xs"} fontWeight={400}>
                            Waiting for the next block or data{" "}
                        </Text>
                        <Spinner marginLeft={2} size={"sm"} />
                    </Flex>
                ) : undefined}
            </Grid>
            <Grid
                templateColumns="repeat(2, 1fr)"
                gap={6}
                height="100%"
                width={"100%"}
                overflow={"hidden"}
            >
                {/* Code Editor */}
                <Box
                    position="relative"
                    marginTop={2}
                    height="100%"
                    overflow={"hidden"}
                >
                    <Button
                        height="1.75rem"
                        size="sm"
                        onClick={onClick}
                        position="absolute"
                        zIndex={10}
                        top={2}
                        right={2}
                    >
                        Run
                    </Button>
                    <CodeMirror
                        value={query}
                        onBeforeChange={(editor, data, value) => {
                            setQuery(value);
                        }}
                        options={{
                            mode: "text/x-pgsql",
                            theme: "material",
                            lineNumbers: true,
                        }}
                    />
                </Box>

                {/* Logs */}
                <Box overflow="scroll" flex="1 1 auto" width={"100%"}>
                    <Table columns={columns} data={logs} />
                </Box>
            </Grid>
        </VStack>
    );
}
