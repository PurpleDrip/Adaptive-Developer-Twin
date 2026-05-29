import { expect } from 'chai';
import { scanForSecrets, containsSecret } from '../../src/secrets/scanner';
import { SECRET_CONTAINING_SNIPPET, CLEAN_SNIPPET } from '../fixtures/sample-events';

describe('scanForSecrets', () => {
  it('redacts AWS access keys (AKIA...)', () => {
    const input = 'aws_access_key = "AKIAIOSFODNN7EXAMPLE"';
    const result = scanForSecrets(input);
    expect(result).to.not.include('AKIAIOSFODNN7EXAMPLE');
    expect(result).to.include('<<REDACTED:AWS_ACCESS_KEY>>');
  });

  it('redacts password assignments', () => {
    const input = 'password = "MyVerySecret123"';
    const result = scanForSecrets(input);
    expect(result).to.not.include('MyVerySecret123');
  });

  it('redacts MongoDB connection strings', () => {
    const input = 'const uri = "mongodb+srv://user:pass@cluster.mongodb.net/db"';
    const result = scanForSecrets(input);
    expect(result).to.not.include('user:pass@');
    expect(result).to.include('<<REDACTED:MONGO_URI>>');
  });

  it('does not redact clean code as AWS_ACCESS_KEY or PASSWORD', () => {
    const result = scanForSecrets(CLEAN_SNIPPET);
    expect(result).to.not.include('<<REDACTED:AWS_ACCESS_KEY>>');
    expect(result).to.not.include('<<REDACTED:GITHUB_PAT>>');
    expect(result).to.not.include('<<REDACTED:PASSWORD>>');
  });

  it('redacts all secrets in a multi-secret snippet', () => {
    const result = scanForSecrets(SECRET_CONTAINING_SNIPPET);
    expect(result).to.not.include('AKIAIOSFODNN7EXAMPLE');
    expect(result).to.not.include('MySecret123');
  });

  it('returns original string when no secrets present', () => {
    const clean = 'const x = 42;';
    expect(scanForSecrets(clean)).to.equal(clean);
  });

  it('handles empty string without throwing', () => {
    expect(scanForSecrets('')).to.equal('');
  });
});

describe('containsSecret', () => {
  it('returns true for text with AWS key', () => {
    expect(containsSecret('AKIAIOSFODNN7EXAMPLE rest of text')).to.equal(true);
  });

  it('returns false for clean text', () => {
    expect(containsSecret('const x = 42;')).to.equal(false);
  });

  it('returns false for empty string', () => {
    expect(containsSecret('')).to.equal(false);
  });
});
