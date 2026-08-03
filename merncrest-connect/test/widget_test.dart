import 'package:flutter_test/flutter_test.dart';
import 'package:merncrest_connect/main.dart';

void main() {
  testWidgets('app boots to splash/login gate', (WidgetTester tester) async {
    await tester.pumpWidget(const MernCrestConnectApp());
    await tester.pump();
    expect(find.text('MernCrest Connect'), findsWidgets);
  });
}
