import * as React from "react";
import { ChakraProvider, Box, Text, VStack } from "@chakra-ui/react";
import { ColorModeSwitcher } from "./ColorModeSwitcher";
import Listener from "./components/Listener";

import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/panda-syntax.css";
import "codemirror/mode/sql/sql";
import theme from "./theme";

export const App = () => (
    <ChakraProvider theme={theme}>
        <VStack height={"100vh"} overflow={"hidden"} paddingBottom={2} paddingX={4}>
            <ColorModeSwitcher defaultValue={"dark"} justifySelf="flex-end" position={"absolute"} left={0} />
            <Box textAlign={"center"}>
                <Text fontSize={"3xl"} fontWeight={100} >
                    Blockchain tail
                </Text>
            </Box>
            <Listener />
        </VStack>
    </ChakraProvider >
);
