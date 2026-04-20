-- Move archery into normal account/cart registration.
-- Runtime checkout enforces the $125 price; this keeps D1 catalog/admin data aligned.

UPDATE program_prices
SET amount = 12500,
    frequency = 'per_series',
    registration_fee = 0,
    active = 1
WHERE program_id = 'archery'
  AND age_group = 'all';

UPDATE program_offers
SET active = 0
WHERE program_id = 'archery'
  AND is_private = 1;

UPDATE waiver_documents
SET body_html = '<h2>Archery waiver</h2><p>In consideration of Ibraheem Gaied (the instructor), Sunnah Skills (the organizers) and their volunteers permitting me or any Dependant Registrants listed to participate in the activity of Archery, I agree to release, indemnify and save harmless Ibraheem Gaied (the instructor), Sunnah Skills (the organizers) and their volunteers from and against all claims, proceedings and/or actions in respect of any costs, losses, damage or injury arising by reason of my or the Dependant Registrants'' participation in the activity of Archery.</p><p>I fully understand that this activity involves risk of serious bodily injury which may be caused by my own actions, or inactions, those of others participating in the activity, the conditions in which the activity takes place, or the negligence of the instructor, organizers and/or their volunteers; and that there may be other risks either not known to me or not readily foreseeable at this time; and I fully accept and assume all such risks and all responsibility for losses, costs, and damages I incur as a result of my own participation in the activity. I understand that the rules set by the instructor, organizers and volunteers must be followed at all times.</p><p>I hereby release, discharge, and hold harmless Ibraheem Gaied (the instructor), Sunnah Skills (the organizers), their volunteers and other participants.</p><p><strong>Participant Signatures</strong></p><h2>Parent Consent</h2><p>I, the minor''s parent and/or legal guardian, understand the nature of the above referenced activity (Archery) and the minor''s experience and capabilities and believe the minor to be qualified to participate in such activity. I hereby release, discharge, hold harmless and agree to indemnify and save and hold harmless Ibraheem Gaied (the instructor), Sunnah Skills (the organizers) and their volunteers from all liability, claims, demands, losses, or damages on the minor''s account.</p><p><strong>Participant Signature</strong><br />If under 18, parent/guardian signature required.</p>',
    version_label = '2026.04.20'
WHERE slug = 'archery'
  AND active = 1;
