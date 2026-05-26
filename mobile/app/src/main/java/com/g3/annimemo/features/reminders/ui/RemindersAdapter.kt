package com.g3.annimemo.features.reminders.ui

import android.text.SpannableString
import android.text.Spanned
import android.text.style.StrikethroughSpan
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.g3.annimemo.core.network.ReminderDto
import com.g3.annimemo.databinding.ItemReminderBinding
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class RemindersAdapter(
    private var reminders: List<ReminderDto>,
    private val onToggleClick: (ReminderDto) -> Unit,
    private val onDeleteClick: (ReminderDto) -> Unit
) : RecyclerView.Adapter<RemindersAdapter.ReminderViewHolder>() {

    inner class ReminderViewHolder(private val binding: ItemReminderBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(reminder: ReminderDto) {
            // Check state
            binding.tvReminderCheck.text = if (reminder.completed) "✅" else "⬜"
            
            // Strike through if completed
            if (reminder.completed) {
                val spannable = SpannableString(reminder.title)
                spannable.setSpan(StrikethroughSpan(), 0, reminder.title.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                binding.tvReminderTitle.text = spannable
                binding.tvReminderTitle.alpha = 0.6f
            } else {
                binding.tvReminderTitle.text = reminder.title
                binding.tvReminderTitle.alpha = 1.0f
            }

            // Pet Name badge
            binding.tvReminderPetBadge.text = "🐾 ${reminder.petName ?: "Pet"}"

            // Due Date formatting
            binding.tvReminderDueTag.text = formatDueDate(reminder.dueDate, reminder.completed)

            // Click listeners
            binding.root.setOnClickListener { onToggleClick(reminder) }
            binding.tvReminderCheck.setOnClickListener { onToggleClick(reminder) }
            binding.btnDeleteReminder.setOnClickListener { onDeleteClick(reminder) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReminderViewHolder {
        val binding = ItemReminderBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ReminderViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReminderViewHolder, position: Int) {
        holder.bind(reminders[position])
    }

    override fun getItemCount(): Int = reminders.size

    fun updateList(newReminders: List<ReminderDto>) {
        reminders = newReminders
        notifyDataSetChanged()
    }

    private fun formatDueDate(dueDateStr: String?, completed: Boolean): String {
        if (dueDateStr.isNullOrEmpty()) return "No due date"
        return try {
            val date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(dueDateStr) ?: return "No due date"
            val sdf = SimpleDateFormat("MMM d, yyyy", Locale.getDefault())
            val formatted = sdf.format(date)
            
            if (completed) return formatted

            // Add relative due indicator
            val today = Calendar.getInstance().apply { 
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.time
            
            if (date.before(today)) {
                "⚠️ Overdue ($formatted)"
            } else if (date.time == today.time) {
                "🔴 Today ($formatted)"
            } else {
                formatted
            }
        } catch (e: Exception) {
            dueDateStr
        }
    }
}
