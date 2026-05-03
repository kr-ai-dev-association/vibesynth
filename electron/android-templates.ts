/**
 * Templates for the boilerplate Kotlin Compose project that Phase 1
 * scaffolds when the user clicks "Run on Android".
 *
 * Phase 1 ships a single-screen Hello World; later phases will replace
 * the screen Composables with AI-generated ones derived from the design.
 *
 * Versions are pinned to a combination known to work together:
 *   - AGP 8.2.2 + Gradle 8.5 (JDK 17+)
 *   - Kotlin 1.9.22 + Compose Compiler 1.5.10
 *   - Compose BOM 2024.02.00 + Material3
 */

const GRADLE_VERSION = '8.5'
const AGP_VERSION = '8.2.2'
const KOTLIN_VERSION = '1.9.22'
const COMPOSE_COMPILER_VERSION = '1.5.10'
const COMPOSE_BOM = '2024.02.00'
const COMPILE_SDK = 34
const MIN_SDK = 24
const TARGET_SDK = 34

export interface AndroidScaffoldOptions {
  projectName: string  // e.g. "VibeSynth Demo"
  packageName: string  // e.g. "ai.banya.vibesynth.proj.abc123"
  appLabel: string     // visible launcher label
}

/** All files (relative path → contents) for a fresh scaffold. */
export function buildKotlinScaffold(opts: AndroidScaffoldOptions): Record<string, string> {
  const { projectName, packageName, appLabel } = opts
  const packagePath = packageName.replace(/\./g, '/')
  return {
    'settings.gradle.kts': SETTINGS_GRADLE(projectName),
    'build.gradle.kts': ROOT_BUILD_GRADLE(),
    'gradle.properties': GRADLE_PROPERTIES(),
    'gradle/wrapper/gradle-wrapper.properties': GRADLE_WRAPPER_PROPS(),
    'gradlew': GRADLEW_SH(),
    'gradlew.bat': GRADLEW_BAT(),
    'app/build.gradle.kts': APP_BUILD_GRADLE(packageName),
    'app/proguard-rules.pro': '# Phase 1 scaffold — empty by default\n',
    'app/src/main/AndroidManifest.xml': MANIFEST(),
    [`app/src/main/java/${packagePath}/MainActivity.kt`]: MAIN_ACTIVITY(packageName, appLabel),
    [`app/src/main/java/${packagePath}/Screens.kt`]: PLACEHOLDER_SCREENS(packageName),
    [`app/src/main/java/${packagePath}/ui/theme/Theme.kt`]: THEME_FILE(packageName),
    'app/src/main/res/values/strings.xml': STRINGS_XML(appLabel),
    'app/src/main/res/values/colors.xml': COLORS_XML(),
    'app/src/main/res/values/themes.xml': THEMES_XML(),
    'app/src/main/res/values-night/themes.xml': THEMES_XML_NIGHT(),
  }
}

/** Wrapper jar URL (binary, fetched once + cached under app userData). */
export const GRADLE_WRAPPER_JAR_URL =
  `https://raw.githubusercontent.com/gradle/gradle/v${GRADLE_VERSION}.0/gradle/wrapper/gradle-wrapper.jar`

// ─── file contents ────────────────────────────────────────────

const SETTINGS_GRADLE = (projectName: string) => `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = ${JSON.stringify(projectName)}
include(":app")
`

const ROOT_BUILD_GRADLE = () => `plugins {
    id("com.android.application") version "${AGP_VERSION}" apply false
    id("org.jetbrains.kotlin.android") version "${KOTLIN_VERSION}" apply false
}
`

const GRADLE_PROPERTIES = () => `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true

android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`

const GRADLE_WRAPPER_PROPS = () => `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`

const APP_BUILD_GRADLE = (packageName: string) => `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = ${JSON.stringify(packageName)}
    compileSdk = ${COMPILE_SDK}

    defaultConfig {
        applicationId = ${JSON.stringify(packageName)}
        minSdk = ${MIN_SDK}
        targetSdk = ${TARGET_SDK}
        versionCode = 1
        versionName = "0.1.0"
        vectorDrawables { useSupportLibrary = true }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "${COMPOSE_COMPILER_VERSION}"
    }

    packaging {
        resources { excludes += setOf("META-INF/AL2.0", "META-INF/LGPL2.1") }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:${COMPOSE_BOM}"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
`

const MANIFEST = () => `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.VibeSynthApp"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.VibeSynthApp">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`

const MAIN_ACTIVITY = (packageName: string, _appLabel: string) => `package ${packageName}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import ${packageName}.ui.theme.VibeSynthAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VibeSynthAppTheme {
                // App() lives in Screens.kt — the agent decides the
                // navigation pattern (bottom nav / tabs / drawer / single
                // screen) based on what the design HTMLs show. We don't
                // wrap it in Surface here so the agent's Scaffold (if it
                // uses one) controls the system bar insets.
                App()
            }
        }
    }
}
`

/**
 * Placeholder App() — written at scaffold time so MainActivity compiles
 * even before the codegen step has run. Codegen later overwrites this
 * file. The agent is FREE to design any navigation (Scaffold +
 * BottomAppBar, TabRow, NavigationDrawer, single screen) — MainActivity
 * just calls App() and lets the agent decide the structure.
 */
const PLACEHOLDER_SCREENS = (packageName: string) => `package ${packageName}

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun App() {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("VibeSynth", style = MaterialTheme.typography.headlineMedium)
            Text("AI screens not yet generated.", style = MaterialTheme.typography.bodyMedium)
        }
    }
}
`

const THEME_FILE = (packageName: string) => `package ${packageName}.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF1E3A8A),
    onPrimary = Color.White,
    background = Color(0xFFFAFAFA),
    onBackground = Color(0xFF111111),
    surfaceVariant = Color(0xFFEFEFF2),
    onSurfaceVariant = Color(0xFF555555),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFFDE047),
    onPrimary = Color(0xFF111111),
    background = Color(0xFF0A0A0A),
    onBackground = Color(0xFFF5F5F5),
    surfaceVariant = Color(0xFF222222),
    onSurfaceVariant = Color(0xFFAAAAAA),
)

@Composable
fun VibeSynthAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content
    )
}
`

const STRINGS_XML = (appLabel: string) => `<resources>
    <string name="app_name">${escapeXml(appLabel)}</string>
</resources>
`

const COLORS_XML = () => `<resources>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
</resources>
`

const THEMES_XML = () => `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.VibeSynthApp" parent="android:Theme.Material.Light.NoActionBar" />
</resources>
`

const THEMES_XML_NIGHT = () => `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.VibeSynthApp" parent="android:Theme.Material.NoActionBar" />
</resources>
`

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c] as string))
}

// ─── gradlew shell scripts ────────────────────────────────────
// Standard gradle wrapper scripts (8.5). These are public-domain shell
// templates from the gradle/gradle repo. Must remain executable.

const GRADLEW_SH = () => `#!/bin/sh

#
# Copyright © 2015-2021 the original authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#

##############################################################################
#
#   Gradle start up script for POSIX generated by Gradle.
#
##############################################################################

# Attempt to set APP_HOME

# Resolve links: $0 may be a link
app_path=$0

# Need this for daisy-chained symlinks.
while
    APP_HOME=\${app_path%"\${app_path##*/}"}  # leaves a trailing /; empty if no leading path
    [ -h "$app_path" ]
do
    ls=$( ls -ld "$app_path" )
    link=\${ls#*' -> '}
    case $link in             #(
      /*)   app_path=$link ;; #(
      *)    app_path=$APP_HOME$link ;;
    esac
done

APP_HOME=$( cd "\${APP_HOME:-./}" && pwd -P ) || exit

APP_NAME="Gradle"
APP_BASE_NAME=\${0##*/}

DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

MAX_FD=maximum

warn () {
    echo "$*"
} >&2

die () {
    echo
    echo "$*"
    echo
    exit 1
} >&2

cygwin=false
msys=false
darwin=false
nonstop=false
case "$( uname )" in                #(
  CYGWIN* )         cygwin=true  ;; #(
  Darwin* )         darwin=true  ;; #(
  MSYS* | MINGW* )  msys=true    ;; #(
  NONSTOP* )        nonstop=true ;;
esac

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        JAVACMD=$JAVA_HOME/jre/sh/java
    else
        JAVACMD=$JAVA_HOME/bin/java
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
    fi
else
    JAVACMD=java
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
fi

if ! "$cygwin" && ! "$darwin" && ! "$nonstop" ; then
    case $MAX_FD in #(
      max*)
        MAX_FD=$( ulimit -H -n ) ||
            warn "Could not query maximum file descriptor limit"
    esac
    case $MAX_FD in  #(
      '' | soft) :;; #(
      *)
        ulimit -n "$MAX_FD" ||
            warn "Could not set maximum file descriptor limit to $MAX_FD"
    esac
fi

if "$cygwin" || "$msys" ; then
    APP_HOME=$( cygpath --path --mixed "$APP_HOME" )
    CLASSPATH=$( cygpath --path --mixed "$CLASSPATH" )

    JAVACMD=$( cygpath --unix "$JAVACMD" )

    for arg do
        if
            case $arg in                                #(
              -*)   false ;;                            # don't mess with options
              /?*)  t=\${arg#/} t=/\${t%%/*}              # looks like a POSIX filepath
                    [ -e "$t" ] ;;                      #(
              *)    false ;;
            esac
        then
            arg=$( cygpath --path --ignore --mixed "$arg" )
        fi
        shift
        set -- "$@" "$arg"
    done
fi

DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

set -- \\
        -classpath "$CLASSPATH" \\
        org.gradle.wrapper.GradleWrapperMain \\
        "$@"

if ! command -v xargs >/dev/null 2>&1
then
    die "xargs is not available"
fi

eval "set -- $(
        printf '%s\\n' "$DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS" |
        xargs -n1 |
        sed ' s~[^-[:alnum:]+,./:=@_]~\\\\\\\\&~g; ' |
        tr '\\n' ' '
    )" '"$@"'

exec "$JAVACMD" "$@"
`

const GRADLEW_BAT = () => `@rem Trimmed Windows wrapper — VibeSynth Phase 1 (mac/linux only).
@echo off
echo VibeSynth Phase 1 does not support Windows runs yet.
exit /b 1
`
