package com.sirravenznest.delvers;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.content.ContextCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;

import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

public final class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        // The page is bundled local content; it must reach Firebase over REST from a file:// origin.
        settings.setAllowUniversalAccessFromFileURLs(true);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.addJavascriptInterface(new NativeBridge(), "DelversNative");
        setContentView(webView);
        restoreGameWindow();
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onResume() {
        super.onResume();
        restoreGameWindow();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            restoreGameWindow();
        }
    }

    private void restoreGameWindow() {
        // Keep transient phone controls outside the game and restore immersive mode after Home.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
        if (webView != null) {
            ViewCompat.requestApplyInsets(webView);
            webView.requestLayout();
        }
    }

    private void toJs(String token, String error) {
        final String js = "window.onNativeGoogle&&window.onNativeGoogle("
                + (token == null ? "null" : JSONObject.quote(token)) + ","
                + (error == null ? "null" : JSONObject.quote(error)) + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    private final class NativeBridge {
        @JavascriptInterface
        public void signIn(final String webClientId) {
            runOnUiThread(() -> {
                try {
                    GetGoogleIdOption option = new GetGoogleIdOption.Builder()
                            .setFilterByAuthorizedAccounts(false)
                            .setServerClientId(webClientId)
                            .build();
                    GetCredentialRequest request = new GetCredentialRequest.Builder()
                            .addCredentialOption(option)
                            .build();
                    CredentialManager.create(MainActivity.this).getCredentialAsync(
                            MainActivity.this, request, null,
                            ContextCompat.getMainExecutor(MainActivity.this),
                            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                                @Override
                                public void onResult(GetCredentialResponse result) {
                                    if (result.getCredential() instanceof CustomCredential) {
                                        CustomCredential cc = (CustomCredential) result.getCredential();
                                        if (GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(cc.getType())) {
                                            toJs(GoogleIdTokenCredential.createFrom(cc.getData()).getIdToken(), null);
                                            return;
                                        }
                                    }
                                    toJs(null, "Unexpected sign-in response.");
                                }

                                @Override
                                public void onError(GetCredentialException e) {
                                    toJs(null, e instanceof GetCredentialCancellationException
                                            ? "Sign-in cancelled."
                                            : "Google sign-in failed: " + e.getMessage());
                                }
                            });
                } catch (Exception e) {
                    toJs(null, "Google sign-in could not start: " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void signOut() {
            runOnUiThread(() -> CredentialManager.create(MainActivity.this).clearCredentialStateAsync(
                    new ClearCredentialStateRequest(), null,
                    ContextCompat.getMainExecutor(MainActivity.this),
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        @Override
                        public void onResult(Void result) { }

                        @Override
                        public void onError(ClearCredentialException e) { }
                    }));
        }
    }
}
