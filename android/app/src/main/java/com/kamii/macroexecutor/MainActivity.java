package com.kamii.macroexecutor;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MacroBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
