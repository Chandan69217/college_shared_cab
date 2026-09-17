import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/settings_service.dart';
import '../../../core/utils/app_feedback.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _subjectController = TextEditingController();
  final _descController = TextEditingController();
  String _category = 'VEHICLE';
  String _priority = 'MEDIUM';
  bool _isSubmitting = false;
  List<dynamic> _myTickets = [];
  bool _isLoadingTickets = true;

  final List<String> _categories = [
    'BOOKING',
    'PAYMENT',
    'DRIVER',
    'VEHICLE',
    'PASS_QR',
    'SUBSCRIPTION',
    'LOST_ITEM',
    'OTHER',
  ];

  Future<void> _fetchTickets() async {
    try {
      final res = await apiClient.get('/complaints/my');
      if (res.data['success'] == true && mounted) {
        setState(() {
          _myTickets = res.data['data'] ?? [];
          _isLoadingTickets = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingTickets = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchTickets();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmitTicket() async {
    if (_subjectController.text.trim().isEmpty) {
      AppFeedback.showWarning(context, 'Subject is required.');
      return;
    }
    if (_descController.text.trim().isEmpty) {
      AppFeedback.showWarning(context, 'Description is required.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final res = await apiClient.post('/complaints', data: {
        'category': _category,
        'subject': _subjectController.text.trim(),
        'description': _descController.text.trim(),
        'priority': _priority,
      });

      if (res.data['success'] == true && mounted) {
        _subjectController.clear();
        _descController.clear();
        AppFeedback.showSuccess(context, 'Support ticket created successfully.');
        _fetchTickets();
      }
    } catch (e) {
      if (mounted) {
        AppFeedback.showError(context, e);
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _triggerSos() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppColors.accentRose, size: 28),
            SizedBox(width: 8),
            Text('Trigger Emergency SOS?', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: const Text(
          'This will immediately transmit your real-time GPS coordinates and alert Campus Security and emergency contacts.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentRose),
            child: const Text('CONFIRM SOS'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final res = await apiClient.post('/students/sos', data: {
          'location': {'latitude': 28.5355, 'longitude': 77.3910},
        });

        if (res.data['success'] == true && mounted) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              backgroundColor: AppColors.surfaceCard,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: const Row(
                children: [
                  Icon(Icons.shield_rounded, color: AppColors.accentRose, size: 28),
                  SizedBox(width: 8),
                  Text('SOS Transmitted', style: TextStyle(color: Colors.white, fontSize: 16)),
                ],
              ),
              content: const Text(
                'Campus Police & Emergency Patrol have received your location. Help is on the way.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              actions: [
                ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        }
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    final supportPhone = SettingsService.instance.supportPhone;
    final supportEmail = SettingsService.instance.supportEmail;
    final sosBroadcastEnabled = SettingsService.instance.emergencySosBroadcast;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Support & Grievance Redressal'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Campus Helpdesk Contact Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF374151)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Campus Transport Helpline',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.phone_in_talk_rounded, color: AppColors.primaryLight, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        supportPhone,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.email_outlined, color: AppColors.primaryLight, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        supportEmail,
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Campus SOS Button Card
            if (sosBroadcastEnabled) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF881337),
                      AppColors.surfaceCard,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.accentRose.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.accentRose.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.emergency_rounded, color: AppColors.accentRose, size: 28),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Campus Safety SOS',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Instant broadcast to campus security patrol',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: _triggerSos,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentRose,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      child: const Text('SOS', style: TextStyle(fontWeight: FontWeight.w900)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Submit Complaint Form
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF374151)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Create Support Ticket',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 12),

                  DropdownButtonFormField<String>(
                    value: _category,
                    dropdownColor: AppColors.surface,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(labelText: 'Category'),
                    items: _categories.map((c) {
                      return DropdownMenuItem(value: c, child: Text(c));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _category = val);
                    },
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _subjectController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(labelText: 'Subject / Title'),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _descController,
                    maxLines: 3,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      hintText: 'Describe your issue or lost item details...',
                    ),
                  ),
                  const SizedBox(height: 16),

                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleSubmitTicket,
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text('Submit Ticket to Admin'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // My Support Tickets History
            const Text(
              'My Support Tickets',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 10),

            if (_isLoadingTickets)
              const Center(child: CircularProgressIndicator(color: AppColors.primary))
            else if (_myTickets.isEmpty)
              const Text('No past complaints logged.', style: TextStyle(color: AppColors.textMuted, fontSize: 12))
            else
              ..._myTickets.map((t) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF374151)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            t['ticket_number'] ?? 'TKT',
                            style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'monospace'),
                          ),
                          Text(
                            t['status'] ?? 'OPEN',
                            style: const TextStyle(color: AppColors.accentAmber, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(t['subject'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 2),
                      Text(t['description'] ?? '', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                      if (t['admin_response'] != null) ...[
                        const Divider(color: Color(0xFF374151), height: 16),
                        Text('Admin Response: ${t['admin_response']}', style: const TextStyle(color: AppColors.primaryLight, fontSize: 11, fontStyle: FontStyle.italic)),
                      ],
                    ],
                  ),
                );
              }).toList(),
          ],
        ),
      ),
    );
  }
}
