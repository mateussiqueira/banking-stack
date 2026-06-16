import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from '@/components/ui/FileUpload';

function createMockFile(name: string, type: string, size: number): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('FileUpload', () => {
  it('should render drop zone when no file is selected', () => {
    render(<FileUpload label="Documento" />);
    expect(screen.getByText(/arraste o arquivo/i)).toBeDefined();
  });

  it('should show file info after file is selected', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1000);
    render(<FileUpload label="Documento" value={file} />);
    expect(screen.getByText('doc.pdf')).toBeDefined();
  });

  it('should call onChange when file is provided', () => {
    const onChange = vi.fn();
    const file = createMockFile('doc.pdf', 'application/pdf', 1000);
    render(<FileUpload label="Documento" onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should show error message', () => {
    render(<FileUpload label="Documento" error="Arquivo muito grande" />);
    expect(screen.getByText('Arquivo muito grande')).toBeDefined();
  });

  it('should show image preview for image files', () => {
    const file = createMockFile('foto.jpg', 'image/jpeg', 1000);
    render(<FileUpload label="Documento" value={file} preview="data:image/jpeg;base64,test" />);
    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,test');
  });

  it('should display file size in MB', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 2 * 1024 * 1024);
    render(<FileUpload label="Documento" value={file} />);
    expect(screen.getByText(/2\.00 MB/)).toBeDefined();
  });
});
