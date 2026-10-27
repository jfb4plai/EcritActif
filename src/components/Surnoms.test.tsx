import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AvertissementSurnoms from './AvertissementSurnoms';
import ChampSurnom from './ChampSurnom';

beforeEach(() => localStorage.clear());

describe('AvertissementSurnoms : ce que l’enseignant doit savoir avant d’écrire un surnom', () => {
  test('le surnom est facultatif et reste dans le navigateur, jamais envoyé ni conservé par l’application', () => {
    render(<AvertissementSurnoms />);
    expect(screen.getByText(/facultatif/i)).toBeInTheDocument();
    expect(screen.getByText(/reste dans ce navigateur, sur cet appareil/i)).toBeInTheDocument();
    expect(screen.getByText(/ne l’envoie pas et ne le conserve pas/i)).toBeInTheDocument();
  });

  test('avertit de la perte en cas de changement de navigateur ou d’appareil, ou de données effacées', () => {
    render(<AvertissementSurnoms />);
    expect(screen.getByText(/changez de navigateur ou d’appareil/i)).toBeInTheDocument();
    expect(screen.getByText(/videz les données du navigateur/i)).toBeInTheDocument();
  });

  test('recommande de noter aussi sur papier, en lieu sûr', () => {
    render(<AvertissementSurnoms />);
    expect(screen.getByText(/Notez donc aussi sur papier/i)).toBeInTheDocument();
    expect(screen.getByText(/en lieu sûr/i)).toBeInTheDocument();
  });

  test('rappelle la notion de donnée personnelle (RGPD) et la responsabilité de l’enseignant', () => {
    render(<AvertissementSurnoms />);
    expect(screen.getByText(/donnée personnelle \(RGPD\)/i)).toBeInTheDocument();
    expect(screen.getByText(/vous restez responsable/i)).toBeInTheDocument();
    expect(screen.getByText(/prénom ou des initiales/i)).toBeInTheDocument();
  });

  test('ne prétend pas que l’usage est conforme : l’application ne connaît pas les noms', () => {
    render(<AvertissementSurnoms />);
    expect(screen.getByText(/ne connaît pas le nom de vos élèves/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/conforme au RGPD|100 ?%|garanti/i);
  });
});

describe('ChampSurnom : un champ facultatif par élève, avec son aide', () => {
  test('libellé précis, exemple concret et aide reliée', () => {
    render(<ChampSurnom classeId="c1" code="KMNPQR" valeur="" onChange={vi.fn()} />);
    const champ = screen.getByLabelText('Surnom de KMNPQR (facultatif)');
    expect(champ.getAttribute('placeholder')).toBe('Léa');
    const aide = document.getElementById(champ.getAttribute('aria-describedby') as string)?.textContent ?? '';
    expect(aide).toMatch(/seulement dans ce navigateur/i);
  });

  test('écrire mémorise le surnom pour cette classe et prévient le parent', async () => {
    const onChange = vi.fn();
    render(<ChampSurnom classeId="c1" code="KMNPQR" valeur="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/Surnom de KMNPQR/), 'Léa');
    expect(JSON.parse(localStorage.getItem('ecrit:surnoms:c1') as string)).toEqual({ KMNPQR: 'Léa' });
    expect(onChange).toHaveBeenLastCalledWith('KMNPQR', 'Léa');
  });

  test('longueur plafonnée par le champ lui-même', () => {
    render(<ChampSurnom classeId="c1" code="KMNPQR" valeur="" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/Surnom de KMNPQR/)).toHaveAttribute('maxlength', '30');
  });

  test('navigateur qui refuse de mémoriser : message clair, sans bloquer', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqué');
    });
    render(<ChampSurnom classeId="c1" code="KMNPQR" valeur="" onChange={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/Surnom de KMNPQR/), 'L');
    expect(screen.getByRole('alert')).toHaveTextContent(/n’a pas pu mémoriser/i);
    setItem.mockRestore();
  });
});
