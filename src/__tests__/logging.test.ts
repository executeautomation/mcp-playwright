import { Logger } from '../logging/logger';
import { LoggerConfig } from '../logging/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Logger', () => {
  let testLogDir: string;
  let testLogFile: string;

  beforeEach(() => {
    testLogDir = path.join(__dirname, 'test-logs');
    testLogFile = path.join(testLogDir, 'test.log');
    
    // Clean up any existing test logs
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test logs
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('Core Logging Infrastructure', () => {
    it('should create logger with default configuration', () => {
      const config = Logger.createDefaultConfig();
      const logger = new Logger(config);
      
      expect(config.level).toBe('info');
      expect(config.format).toBe('json');
      expect(config.outputs).toContain('console');
    });

    it('should respect log level filtering', () => {
      const config: LoggerConfig = {
        level: 'warn',
        format: 'json',
        outputs: ['console']
      };
      
      const logger = new Logger(config);
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      logger.info('This should not appear');
      logger.warn('This should appear');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should format JSON logs correctly', () => {
      const config: LoggerConfig = {
        level: 'debug',
        format: 'json',
        outputs: ['console']
      };
      
      const logger = new Logger(config);
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      logger.setRequestId('test-123');
      logger.info('Test message', { key: 'value' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"requestId":"test-123"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"context":{"key":"value"}')
      );
      
      consoleSpy.mockRestore();
    });

    it('should write to file when configured', () => {
      const config: LoggerConfig = {
        level: 'info',
        format: 'json',
        outputs: ['file'],
        filePath: testLogFile
      };
      
      const logger = new Logger(config);
      logger.info('Test file message');
      
      expect(fs.existsSync(testLogFile)).toBe(true);
      const logContent = fs.readFileSync(testLogFile, 'utf8');
      expect(logContent).toContain('Test file message');
    });

    it('should handle error logging with stack traces', () => {
      const config: LoggerConfig = {
        level: 'error',
        format: 'json',
        outputs: ['console']
      };
      
      const logger = new Logger(config);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const testError = new Error('Test error');
      logger.error('Error occurred', testError, { context: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"errorName":"Error"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"errorMessage":"Test error"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"stack"')
      );
      
      consoleSpy.mockRestore();
    });
  });
});