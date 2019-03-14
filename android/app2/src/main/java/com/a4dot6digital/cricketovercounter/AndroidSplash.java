package com.a4dot6digital.cricketovercounter;

import android.os.Bundle;
import android.content.Intent;
import android.support.v7.app.AppCompatActivity;

import com.example.google.play.licensing.MainActivity;

public class AndroidSplash extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = new Intent(this, MainActivity.class);
        startActivity(intent);
        finish();
    }
}