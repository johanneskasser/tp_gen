import jsPDF from 'jspdf';
import { TrainingPlan } from '../types';
import { formatDate, getDayName } from './dateUtils';
import { calculateSessionDistance, getRaceDistanceKm } from './calculationUtils';
import { calculatePace, formatPace } from './paceCalculator';

export function exportToPDF(plan: TrainingPlan) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(plan.event.name, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;

  // Event Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const eventDate = formatDate(plan.event.date);
  const distanceText =
    plan.event.distance === 'CUSTOM'
      ? `${plan.event.customDistance} km`
      : `${plan.event.distance} (${getRaceDistanceKm(plan.event.distance)} km)`;
  const terrainText = plan.event.terrain === 'road' ? 'Straße' : 'Trail';

  doc.text(
    `Datum: ${eventDate} | Distanz: ${distanceText} | Terrain: ${terrainText}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  if (plan.event.terrain === 'trail' && plan.event.elevationGain) {
    yPosition += 6;
    doc.text(
      `Höhenmeter: ${plan.event.elevationGain} m`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
  }

  if (plan.event.targetTime) {
    yPosition += 6;
    const distKm = getRaceDistanceKm(plan.event.distance, plan.event.customDistance);
    const pace = calculatePace(plan.event.targetTime, distKm);
    doc.text(
      `Zielzeit: ${plan.event.targetTime} | Pace: ${formatPace(pace)}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
  }

  yPosition += 15;

  // Summary Stats
  const totalKm = plan.weeks.reduce((sum, week) => sum + week.totalKm, 0);
  const avgKm = totalKm / plan.weeks.length;

  doc.setFontSize(10);
  doc.text(
    `Trainingsdauer: ${plan.weeks.length} Wochen | Gesamt: ${totalKm.toFixed(1)} km | Durchschnitt: ${avgKm.toFixed(1)} km/Woche`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  yPosition += 15;

  // Weekly Plans
  for (let i = 0; i < plan.weeks.length; i++) {
    const week = plan.weeks[i];

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // Week Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Woche ${week.weekNumber}`, 15, yPosition);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${formatDate(week.startDate)} - ${formatDate(week.endDate)}`,
      15,
      yPosition + 6
    );

    doc.text(
      `${week.totalKm.toFixed(1)} km`,
      pageWidth - 15,
      yPosition,
      { align: 'right' }
    );

    yPosition += 12;

    // Sessions
    if (week.sessions.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('Keine Trainingseinheiten', 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;
    } else {
      const sortedSessions = [...week.sessions].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek
      );

      for (const session of sortedSessions) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const dayName = getDayName(session.dayOfWeek);
        doc.text(`${dayName}: ${session.title}`, 20, yPosition);

        doc.setFont('helvetica', 'normal');
        const distance = calculateSessionDistance(session);
        doc.text(
          `${distance.toFixed(1)} km`,
          pageWidth - 15,
          yPosition,
          { align: 'right' }
        );

        yPosition += 5;

        // Session details
        doc.setFontSize(9);
        const typeLabels: Record<string, string> = {
          easy: 'Locker',
          long: 'Langer Lauf',
          intervals: 'Intervalltraining',
          tempo: 'Tempodauerlauf',
          recovery: 'Regeneration',
          race: 'Wettkampf',
        };
        doc.text(`Typ: ${typeLabels[session.type] || session.type}`, 25, yPosition);

        yPosition += 5;

        // Intervals
        if (session.intervals && session.intervals.length > 0) {
          // Warm Up
          if (session.warmUp) {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            const warmUpUnit = session.warmUpUnit || 'km';
            doc.text(`  Warm Up: ${session.warmUp}${warmUpUnit}`, 25, yPosition);
            yPosition += 4;
          }

          // Intervals
          for (const interval of session.intervals) {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            const recoveryUnit = interval.recoveryUnit || 'km';
            const intervalText = `  ${interval.repetitions}x ${interval.distance}km${interval.pace ? ` @ ${interval.pace}` : ''}${interval.recovery ? ` (${interval.recovery}${recoveryUnit} Pause)` : ''}`;
            doc.text(intervalText, 25, yPosition);
            yPosition += 4;
          }

          // Cool Down
          if (session.coolDown) {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            const coolDownUnit = session.coolDownUnit || 'km';
            doc.text(`  Cool Down: ${session.coolDown}${coolDownUnit}`, 25, yPosition);
            yPosition += 4;
          }

          yPosition += 1;
        }

        // Notes
        if (session.notes) {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.setTextColor(80, 80, 80);
          const splitNotes = doc.splitTextToSize(
            `Notizen: ${session.notes}`,
            pageWidth - 50
          );
          doc.text(splitNotes, 25, yPosition);
          yPosition += splitNotes.length * 4;
          doc.setTextColor(0, 0, 0);
        }

        yPosition += 3;
      }
    }

    yPosition += 5;

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 8;
  }

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Erstellt mit Trainingsplan Generator am ${formatDate(new Date().toISOString().split('T')[0])}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save
  const fileName = `${plan.event.name.replace(/[^a-z0-9]/gi, '_')}_Trainingsplan.pdf`;
  doc.save(fileName);
}
