import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthService } from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import styles from './Login.module.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type FormData = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FormData>();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await AuthService.register(data);
      
      // Show success toast
       toast.success('Registration successful! Redirecting to login...', {
        position: "top-center",
        autoClose: 2000,
        onClose: () => navigate('/login') // Navigate after toast closes
        });
      
      navigate('/login');
    } catch (err) {
      // Error toast
      toast.error(err instanceof Error ? err.message : 'Registration failed', {
        position: "top-center"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
            <h2 className={styles.loginTitle}>Create Account</h2>
            
            {error && <div className={styles.loginError}>{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className={styles.loginForm}>
            <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.formLabel}>
                Full Name
                </label>
                <input
                id="name"
                type="text"
                className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`}
                {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                <p className={styles.errorMessage}>{errors.name.message}</p>
                )}
            </div>

            {/* Email field (same as login) */}
            <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                Email
                </label>
                <input
                id="email"
                type="email"
                className={`${styles.formInput} ${errors.email ? styles.inputError : ''}`}
                {...register('email', {
                    required: 'Email is required',
                    pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                    },
                })}
                />
                {errors.email && (
                <p className={styles.errorMessage}>{errors.email.message}</p>
                )}
            </div>

            {/* Password field */}
            <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>
                Password
                </label>
                <input
                id="password"
                type="password"
                className={`${styles.formInput} ${errors.password ? styles.inputError : ''}`}
                {...register('password', {
                    required: 'Password is required',
                    minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                    },
                })}
                />
                {errors.password && (
                <p className={styles.errorMessage}>{errors.password.message}</p>
                )}
            </div>

            {/* Password confirmation */}
            <div className={styles.formGroup}>
                <label htmlFor="password_confirmation" className={styles.formLabel}>
                Confirm Password
                </label>
                <input
                id="password_confirmation"
                type="password"
                className={`${styles.formInput} ${errors.password_confirmation ? styles.inputError : ''}`}
                {...register('password_confirmation', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                    value === watch('password') || 'Passwords do not match',
                })}
                />
                {errors.password_confirmation && (
                <p className={styles.errorMessage}>{errors.password_confirmation.message}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
            >
                {isSubmitting && <LoadingSpinner className={styles.spinner} />}
                Register
            </button>
            </form>

            <div className={styles.loginFooter}>
            Already have an account?{' '}
            <a href="/login" className={styles.loginLink}>
                Sign in
            </a>
            </div>
        </div>
    </div>
  );
}