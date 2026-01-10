package com.bubblyclouds.sudoku;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import com.bubblyclouds.sudoku.plugins.SafeAreaPlugin.SafeAreaPlugin;
import com.getcapacitor.Logger;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Logger.debug("MainActivity onCreate");
        // No longer needed as Android System Webview 136 fixed it https://issues.chromium.org/issues/40699457
        // registerPlugin(SafeAreaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
