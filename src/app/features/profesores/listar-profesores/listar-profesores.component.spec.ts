import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarProfesoresComponent } from './listar-profesores.component';

describe('ListarProfesoresComponent', () => {
  let component: ListarProfesoresComponent;
  let fixture: ComponentFixture<ListarProfesoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarProfesoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarProfesoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
