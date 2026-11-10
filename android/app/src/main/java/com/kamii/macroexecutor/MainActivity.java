package com.kamii.macroexecutor;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MacroBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
