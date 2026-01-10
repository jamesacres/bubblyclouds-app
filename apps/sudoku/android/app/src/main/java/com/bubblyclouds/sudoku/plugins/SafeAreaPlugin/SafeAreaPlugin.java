package com.bubblyclouds.sudoku.plugins.SafeAreaPlugin;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin
public class SafeAreaPlugin extends Plugin {

    private WindowInsetsCompat windowInsets = null;

    @Override
    public void load() {
        super.load();


        bridge.getActivity().runOnUiThread(() -> {
            // Get the activity's window
            Window window = bridge.getActivity().getWindow();

            // Set status and navigation bars to transparent
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);
        });

        ViewCompat.setOnApplyWindowInsetsListener(
                bridge.getWebView(),
                (v, insets) -> {
                    this.windowInsets = insets;
                    applyInsets(insets);
                    return WindowInsetsCompat.CONSUMED;
                }
        );
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        if (windowInsets != null) {
            applyInsets(windowInsets);
        }
        call.resolve();
    }

    /**
     * When targeting Android API 35, edge-to-edge handling is enforced. We want
     * to use edge-to-edge layout on devices > API 35, but have to preserve
     * layout margins on older devices - otherwise part of the content is cut
     * off (hidden behind the status bar).
     * Thus, we use `adjustMarginsForEdgeToEdge: 'disable'` and manually handle
     * the case for devices < API 35
     *
     * open issue: https://github.com/ionic-team/capacitor/issues/7951
     */
    private void applyInsets(WindowInsetsCompat windowInsets) {

        final Insets insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime()
        );

        // For devices with API 35 we manually set safe-area inset variables. There is a current issue with the WebView
        // (see https://chromium-review.googlesource.com/c/chromium/src/+/6295663/comments/a5fc2d65_86c53b45?tab=comments)
        // which causes safe-area-insets to not respect system bars.
        // Code based on https://ruoyusun.com/2020/10/21/webview-fullscreen-notch.html
        final float density = bridge.getActivity().getApplicationContext().getResources().getDisplayMetrics().density;

        final long top = Math.round(insets.top / density);
        final long right = Math.round(insets.right / density);
        final long bottom = Math.round(insets.bottom / density);
        final long left = Math.round(insets.left / density);

        bridge
                .getActivity()
                .runOnUiThread(
                        () -> {
                            String js =
                                    "javascript:document.querySelector(':root')?.style.setProperty('--android-safe-area-top', 'max(env(safe-area-inset-top), " +
                                            top +
                                            "px)');" +
                                            "javascript:document.querySelector(':root')?.style.setProperty('--android-safe-area-right', 'max(env(safe-area-inset-right), " +
                                            right +
                                            "px)');" +
                                            "javascript:document.querySelector(':root')?.style.setProperty('--android-safe-area-bottom', 'max(env(safe-area-inset-bottom), " +
                                            bottom +
                                            "px)');" +
                                            "javascript:document.querySelector(':root')?.style.setProperty('--android-safe-area-left', 'max(env(safe-area-inset-left), " +
                                            left +
                                            "px)');" +
                                            "void(0);";
                            bridge.getWebView().loadUrl(js);
                        }
                );
    }
}