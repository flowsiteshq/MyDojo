import { describe, it, expect } from 'vitest';
import { getAvailableClassSchedules } from './db';

describe('Appointment Booking', () => {
  it('should fetch available class schedules for a program', async () => {
    const schedules = await getAvailableClassSchedules(['Little Ninjas'], 'Tomball HQ');
    
    expect(schedules).toBeDefined();
    expect(Array.isArray(schedules)).toBe(true);
    
    if (schedules.length > 0) {
      const schedule = schedules[0];
      expect(schedule).toHaveProperty('program');
      expect(schedule).toHaveProperty('location');
      expect(schedule).toHaveProperty('dayOfWeek');
      expect(schedule).toHaveProperty('startTime');
      expect(schedule).toHaveProperty('endTime');
      expect(schedule.isActive).toBe(1);
    }
  });

  it('should fetch schedules for multiple programs', async () => {
    const schedules = await getAvailableClassSchedules(
      ['Little Ninjas', 'Dragon Kids', 'Teens'],
      'Tomball HQ'
    );
    
    expect(schedules).toBeDefined();
    expect(Array.isArray(schedules)).toBe(true);
  });

  it('should only return active classes', async () => {
    const schedules = await getAvailableClassSchedules(['Little Ninjas'], 'Tomball HQ');
    
    schedules.forEach(schedule => {
      expect(schedule.isActive).toBe(1);
    });
  });

  it('should filter by location', async () => {
    const schedules = await getAvailableClassSchedules(['Little Ninjas'], 'Tomball HQ');
    
    schedules.forEach(schedule => {
      expect(schedule.location).toBe('Tomball HQ');
    });
  });
});
