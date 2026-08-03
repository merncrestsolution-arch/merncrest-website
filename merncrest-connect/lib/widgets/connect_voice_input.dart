import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:speech_to_text/speech_to_text.dart';

/// Mic button that fills a text controller with live speech recognition.
class ConnectVoiceInputButton extends StatefulWidget {
  const ConnectVoiceInputButton({
    super.key,
    required this.controller,
    this.onFinal,
  });

  final TextEditingController controller;
  final VoidCallback? onFinal;

  @override
  State<ConnectVoiceInputButton> createState() => _ConnectVoiceInputButtonState();
}

class _ConnectVoiceInputButtonState extends State<ConnectVoiceInputButton> {
  final _speech = SpeechToText();
  bool _available = false;
  bool _listening = false;

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  Future<void> _initSpeech() async {
    _available = await _speech.initialize(
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          if (mounted) setState(() => _listening = false);
        }
      },
      onError: (_) {
        if (mounted) setState(() => _listening = false);
      },
    );
    if (mounted) setState(() {});
  }

  Future<void> _toggle() async {
    if (!_available) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Voice input is not available on this device')),
      );
      return;
    }
    if (_listening) {
      await _speech.stop();
      setState(() => _listening = false);
      return;
    }
    setState(() => _listening = true);
    await _speech.listen(
      onResult: (result) {
        widget.controller.text = result.recognizedWords;
        if (result.finalResult) {
          widget.onFinal?.call();
        }
      },
      listenMode: ListenMode.confirmation,
    );
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: _toggle,
      icon: Icon(
        _listening ? Icons.mic_rounded : Icons.mic_none_rounded,
        color: _listening ? ConnectColors.error : ConnectColors.primaryGlow,
        size: 22,
      ),
      tooltip: _listening ? 'Stop listening' : 'Voice input',
    );
  }
}
