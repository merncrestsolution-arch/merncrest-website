package lk.merncrest.connect;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import io.flutter.embedding.android.FlutterActivity;
import java.util.Map;

public final class ConnectNotificationHelper {
    private static final String CHANNEL_ID = "merncrest_connect";

    private ConnectNotificationHelper() {}

    public static void show(Context context, String title, String body, Map<String, String> data) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "MernCrest Connect",
                NotificationManager.IMPORTANCE_HIGH
            );
            nm.createNotificationChannel(channel);
        }

        Intent intent = new Intent(context, FlutterActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (data != null) {
            for (Map.Entry<String, String> e : data.entrySet()) {
                intent.putExtra(e.getKey(), e.getValue());
            }
        }

        PendingIntent pi = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_HIGH);

        nm.notify((int) System.currentTimeMillis(), builder.build());
    }
}
