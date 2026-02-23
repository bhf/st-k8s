import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KubectlCheatSheet } from '../KubectlCheatSheet';
import React from 'react';

// Mock clipboard
const mockClipboard = {
  writeText: vi.fn().mockImplementation(() => Promise.resolve()),
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

// Mock Dialog component since it uses Radix UI which can be tricky in tests
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('KubectlCheatSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for a pod', () => {
    render(
      <KubectlCheatSheet
        resourceType="pod-resources"
        resourceName="test-pod"
        namespace="test-ns"
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText(/Kubectl Cheat Sheet: test-pod/)).toBeInTheDocument();
    expect(screen.getByText(/kubectl describe pod test-pod -n test-ns/)).toBeInTheDocument();
    expect(screen.getByText(/kubectl logs test-pod -n test-ns/)).toBeInTheDocument();
    expect(screen.getByText(/kubectl exec -it test-pod -n test-ns -- \/bin\/sh/)).toBeInTheDocument();
  });

  it('renders correctly for a service', () => {
    render(
      <KubectlCheatSheet
        resourceType="services"
        resourceName="test-svc"
        namespace="default"
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText(/kubectl describe service test-svc -n default/)).toBeInTheDocument();
    expect(screen.getByText(/kubectl port-forward svc\/test-svc -n default 8080:80/)).toBeInTheDocument();
  });

  it('renders scale command for replicasets', () => {
    render(
      <KubectlCheatSheet
        resourceType="replicasets"
        resourceName="test-rs"
        namespace="demo"
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText(/kubectl scale replicaset test-rs -n demo --replicas=3/)).toBeInTheDocument();
  });

  it('renders node specific commands', () => {
    render(
      <KubectlCheatSheet
        resourceType="nodes"
        resourceName="test-node"
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText(/kubectl cordon test-node/)).toBeInTheDocument();
    expect(screen.getByText(/kubectl drain test-node --ignore-daemonsets --delete-emptydir-data/)).toBeInTheDocument();
  });

  it('copies command to clipboard', async () => {
    render(
      <KubectlCheatSheet
        resourceType="deployments"
        resourceName="test-deploy"
        namespace="prod"
        open={true}
        onOpenChange={() => {}}
      />
    );

    const copyButtons = screen.getAllByText('Copy');
    fireEvent.click(copyButtons[0]);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('kubectl describe deployment test-deploy -n prod');
  });

  it('does not render when closed', () => {
    render(
      <KubectlCheatSheet
        resourceType="pod-resources"
        resourceName="test-pod"
        namespace="test-ns"
        open={false}
        onOpenChange={() => {}}
      />
    );

    expect(screen.queryByText(/Kubectl Cheat Sheet/)).not.toBeInTheDocument();
  });
});
